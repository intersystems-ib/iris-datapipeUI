import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Catalog} from '../datapipe.model';
import {DatapipeService} from '../datapipe.service';
import {ApexAxisChartSeries, ApexOptions, ApexXAxis} from "ng-apexcharts";

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogComponent implements OnInit {

  /** Available categories */
  categories: string[] = [];

  ///False if no categories selected
  categoryFiltering = false;

  ///Object to check if categories are selected, should be loaded with the categories whenever they load
  selectedCategories = {};


  /** All catalog items */
  allCatalogItems: Catalog[] = [];

  /** Catalog items organized as tree structure */
  catalogTree: Catalog[] = [];

  /** Filtered catalog tree for display */
  filteredCatalogTree: Catalog[] = [];

  /** Count of filtered results */
  filteredResultsCount: number = 0;

  /** Map to store loaded columns for each table */
  private tableColumnsMap = new Map<string, any[]>();

  /** Map to track which tables have columns visible */
  showColumnsMap = new Map<number, boolean>();

  /** Map to track which histograms are loading */
  loadingHistogramMap = new Map<number, boolean>();

  /** Search term */
  private _searchTerm: string = '';

  protected namespaces: string[] = [];

  /** Show all histograms flag */
  showAllHistograms: boolean = false;
  showDescriptions = false;
  showTableInfo = false;

  toggleDescriptions(): void {
    this.showDescriptions = !this.showDescriptions;
    this.cdr.markForCheck();
  }

  toggleTableInfo(): void {
    this.showTableInfo = !this.showTableInfo;
    this.cdr.markForCheck();
  }

  get searchTerm(): string {
    return this._searchTerm;
  }

  set searchTerm(value: string) {
    this._searchTerm = value;
    this.applyFilter();
  }

  /**
   * Clear search term
   */
  clearSearch(): void {
    this._searchTerm = '';
    this.applyFilter();
  }

  constructor(
    private datapipeService: DatapipeService,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.datapipeService.getNamespaces().subscribe(
      namespaces => this.namespaces = namespaces
    )
    this.loadCatalog();
  }

  /**
   * Load catalog data and build tree structure
   */
  loadCatalog(): void {
    this.datapipeService.getCatalog().subscribe(
      data => {
        if (data.result) {
          this.catalogTree = this.calculateGraphInfo(data.result);
          ///TODO both of this ought to go
          this.allCatalogItems = this.catalogTree;
          this.filteredCatalogTree = this.catalogTree;
          // Trim categories to avoid whitespace issues
          this.loadCategories(data.categories)
          this.cdr.markForCheck();
        }
      }
    );
  }

  /**
   * Refresh catalog data from backend
   */
  refreshCatalog(): void {
    // Save current expansion state
    const expansionState = this.saveExpansionState(this.catalogTree);

    // Reload catalog
    this.datapipeService.getCatalog().subscribe(
      data => {
        if (data.result) {
          this.catalogTree = this.calculateGraphInfo(data.result);
          this.allCatalogItems = this.catalogTree;

          // Restore expansion state
          this.restoreExpansionState(this.catalogTree, expansionState);

          // Trim categories to avoid whitespace issues
          this.categories = data.categories.map((cat: string) => cat.trim());

          // Reapply filters
          this.applyFilter();

          this.cdr.markForCheck();
        }
      }
    );
  }

  /**
   * Save expansion state of all items in the tree
   */
  private saveExpansionState(items: Catalog[]): Map<number, boolean> {
    const state = new Map<number, boolean>();

    const traverse = (items: Catalog[]) => {
      items.forEach(item => {
        if (item.expanded !== undefined) {
          state.set(item.Id, item.expanded);
        }
        if (item.Children && item.Children.length > 0) {
          traverse(item.Children);
        }
      });
    };

    traverse(items);
    return state;
  }

  /**
   * Restore expansion state to items in the tree
   */
  private restoreExpansionState(items: Catalog[], state: Map<number, boolean>): void {
    const traverse = (items: Catalog[]) => {
      items.forEach(item => {
        if (state.has(item.Id)) {
          item.expanded = state.get(item.Id);
        }
        if (item.Children && item.Children.length > 0) {
          traverse(item.Children);
        }
      });
    };

    traverse(items);
  }

  /**
   * Toggle expand/collapse for an item
   */
  toggleExpand(item: Catalog): void {
    item.expanded = !item.expanded;
    this.cdr.markForCheck();
  }

  /**
   * Toggle histogram visibility for a specific item
   */
  toggleHistogram(item: Catalog): void {
    const isShowing = !item.showHistogram;

    if (isShowing) {
      // Show loading spinner
      this.loadingHistogramMap.set(item.Id, true);
      item.showHistogram = true;
      this.cdr.markForCheck();

      // Use setTimeout to allow the DOM to update and show the spinner
      // before the heavy rendering of the chart begins
      setTimeout(() => {
        this.loadingHistogramMap.set(item.Id, false);
        this.cdr.markForCheck();
      }, 100);
    } else {
      // Hide histogram immediately
      item.showHistogram = false;
      this.loadingHistogramMap.delete(item.Id);
      this.cdr.markForCheck();
    }
  }

  /**
   * Check if histogram is loading
   */
  isHistogramLoading(item: Catalog): boolean {
    return this.loadingHistogramMap.get(item.Id) || false;
  }

  toggleEditMode(item: Catalog): void {
    if (item.isEditing) {
      // Cancel editing - restore values if needed
      item.isEditing = false;
    } else {
      // Enter edit mode
      item.isEditing = true;
    }
    this.cdr.markForCheck();
  }

  saveEdit(item: Catalog): void {
    // Save logic will be implemented later
    item.isEditing = false;
    this.datapipeService.updateEntry(item).subscribe(
      (result) => {
        this.loadCategories(result.categories)
        item = {...result.result, Children: item.Children}
        this.cdr.markForCheck();
      }
    )

  }

  loadCategories(categories:string[]){
    let selectedCategories = {}
    categories.forEach(
      cat=>{

      }
    )
  }

  cancelEdit(item: Catalog): void {
    // Cancel logic - restore original values if needed
    item.isEditing = false;
    this.datapipeService.getById(item.Id).subscribe(
      (result: { result: Catalog }) => {
        Object.assign(item, result.result);
        console.log(item)
        this.cdr.markForCheck();
      }
    )
  }

  createNewRootEntity(event: Event): void {
    event.stopPropagation();

    // Create a new root entity with default values
    const newEntity: Catalog = {
      Id: -1,
      Category: '',
      Subtypeof: null,
      Entity: 'New Entity',
      EntityDescription: '',
      DataOrigins: '',
      Usage: '',
      Namespace: '',
      Table: '',
      Filter: '',
      MDXTotal: '',
      MDXHistogram: '',
      MDXHistogramUpdated: '',
      Order: this.catalogTree.length,
      Children: [],
      expanded: false,
      isEditing: true // Start in edit mode
    };

    // Add to the tree and flat list
    this.catalogTree.push(newEntity);
    this.allCatalogItems.push(newEntity);

    // Refresh the view
    this.applyFilter();
    this.cdr.markForCheck();

    // Scroll to the new entity
    this.scrollToEntity(newEntity.Id);
  }

  addChildEntity(parent: Catalog, event: Event): void {
    event.stopPropagation();

    // Create a new child entity
    const newChild: Catalog = {
      Id: -1,
      Category: parent.Category,
      Subtypeof: parent.Id,
      Entity: 'New Subtype',
      EntityDescription: '',
      DataOrigins: '',
      Usage: '',
      Namespace: '',
      Table: '',
      Filter: '',
      MDXTotal: '',
      MDXHistogram: '',
      MDXHistogramUpdated: '',
      Order: parent.Children ? parent.Children.length : 0,
      Children: [],
      expanded: false,
      isEditing: true // Start in edit mode
    };

    // Initialize children array if needed
    if (!parent.Children) {
      parent.Children = [];
    }

    // Add to parent's children and flat list
    parent.Children.push(newChild);
    this.allCatalogItems.push(newChild);

    // Expand parent to show new child
    parent.expanded = true;

    // Refresh the view
    this.applyFilter();
    this.cdr.markForCheck();

    // Scroll to the new entity
    this.scrollToEntity(newChild.Id);
  }

  private scrollToEntity(entityId: number): void {
    // Use setTimeout to ensure the DOM has been updated
    setTimeout(() => {
      const element = document.getElementById(`catalog-card-${entityId}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  }

  toggleColumns(item: Catalog): void {
    const isVisible = this.showColumnsMap.get(item.Id) || false;

    if (!isVisible && !this.tableColumnsMap.has(item.Table)) {
      // Load columns if not already loaded
      this.datapipeService.getTableColumns(item.Table).subscribe(
        (columns: any) => {
          this.tableColumnsMap.set(item.Table, columns);
          this.showColumnsMap.set(item.Id, true);
          this.cdr.markForCheck();
        },
        (error: any) => {
          console.error('Error loading table columns:', error);
        }
      );
    } else {
      // Toggle visibility
      this.showColumnsMap.set(item.Id, !isVisible);
      this.cdr.markForCheck();
    }
  }

  getTableColumns(item: Catalog): any[] {
    return this.tableColumnsMap.get(item.Table) || [];
  }

  isColumnsVisible(item: Catalog): boolean {
    return this.showColumnsMap.get(item.Id) || false;
  }

  // En CatalogComponent
  isCompact(item: Catalog): boolean {
    return !this.showDescriptions && !this.showTableInfo && !item.showHistogram;
  }


  /**
   * Toggle all histograms visibility
   */
  toggleAllHistograms(): void {
    this.showAllHistograms = !this.showAllHistograms;
    this.toggleHistogramVisibility(this.allCatalogItems, this.showAllHistograms)
    this.cdr.markForCheck();
  }

  toggleHistogramVisibility(catalogs: Catalog[], value: boolean) {
    catalogs.forEach(
      catalog => {
        catalog.showHistogram = value
        if (catalog.Children) this.toggleHistogramVisibility(catalog.Children, value)
      }
    )
  }

  /**
   * Expand all tree items
   */
  expandAll(): void {
    this.expandLevel(this.allCatalogItems)
    this.cdr.markForCheck()
  }

  expandLevel(level: Catalog[]) {
    level.forEach(
      entry => {
        entry.expanded = true;
        if (entry.Children) this.expandLevel(entry.Children)
      }
    )
  }

  /**
   * Collapse all tree items
   */
  collapseAll(): void {
    this.collapseLevel(this.allCatalogItems)
    this.cdr.markForCheck()
  }

  collapseLevel(level: Catalog[]) {
    level.forEach(
      entry => {
        entry.expanded = false;
        if (entry.Children) this.collapseLevel(entry.Children)
      }
    )
  }


  /**
   * TrackBy function for ngFor to improve performance
   */
  trackById(_index: number, item: Catalog): number {
    return item.Id;
  }

  /**
   * Apply filter based on search term and selected categories
   */
  applyFilter(): void {
  }


  /**
   * Format large numbers (888, 34.5k, 3.5M)
   */
  formatNumber(num: number): string {
    if (num === null) return ''
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    } else {
      return num.toString();
    }
  }

  /**
   * Format number with thousands separators (e.g., 1,234,567)
   */
  formatNumberWithSeparators(num: number): string {
    if (num === null || num === undefined) return '';
    return num.toLocaleString('en-US');
  }

  /**
   * Highlight search term(s) in text
   * Supports multiple terms separated by space
   */
  highlightSearch(text?: string): string {
    if (!text) {
      return '';
    }

    const term = this.searchTerm.trim();
    if (!term) {
      return text;
    }

    // Split by spaces to get multiple terms
    const terms = term.split(/\s+/).filter(t => t.length > 0);

    let highlightedText = text;

    // Highlight each term
    terms.forEach(searchTerm => {
      // Escapar caracteres especiales de Regex
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });

    return highlightedText;
  }

  /** Mueve el item dentro de su rama y reindexa Order (0..n) */
  moveItem(item: Catalog, index: number, array: Catalog[], direction: 'up' | 'down'): void {
    if (item.Id === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === array.length - 1) return;
    this.datapipeService.reorder(item.Id, array[index + (direction === 'up' ? -1 : 1)].Id).subscribe(
      () => {
        array[index] = array[index + (direction === 'up' ? -1 : 1)]
        array[index + (direction === 'up' ? -1 : 1)] = item
        this.cdr.markForCheck();
      }
    )

  }


  protected options: Partial<ApexOptions> = {
    series: [{
      name: 'Records',
      data: []
    }],
    chart: {
      type: 'bar',
      height: 200,
      toolbar: {
        show: false
      },
      stacked: false
    },
    plotOptions: {
      bar: {
        columnWidth: '70%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return CatalogComponent.formatNumberGraph(val);
      },
      offsetY: -20,
      style: {
        fontSize: '10px',
        colors: ['#304758']
      }
    },
    xaxis: {
      categories: [],
      labels: {
        style: {
          fontSize: '11px'
        }
      }
    },
    yaxis: {
      show: false
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: function (val: number) {
          return CatalogComponent.formatNumberGraph(val) + ' records';
        }
      }
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'center',
      fontSize: '11px',
      markers: {
        width: 8,
        height: 8
      }
    },
    colors: ['#3f51b5', '#ff9800']
  };

  static formatNumberGraph(num: number) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    } else {
      return num.toString();
    }
  }

  calculateGraphInfo(catalogs: Catalog[]) {
    catalogs.forEach(
      catalog => {
        if (catalog.Histogram) {
          catalog.HistogramSeries = this.getSeries(catalog.Histogram, catalog.HistogramUpdated)
          catalog.HistogramXaxis = this.getYears(catalog.Histogram, catalog.HistogramUpdated)
        }
        if (catalog.Children) {
          catalog.Children = this.calculateGraphInfo(catalog.Children)
        }
      }
    )
    return catalogs
  }

  getChartOptions(item: Catalog): Partial<ApexOptions> {
    const numCategories = item.Histogram ? Object.keys(item.Histogram).length : 0;
    const showDataLabels = numCategories <= 18;
    const hasUpdatedData = item.HistogramUpdated && Object.keys(item.HistogramUpdated).length > 0;

    const chartOptions: Partial<ApexOptions> = {
      ...this.options,
      dataLabels: {
        enabled: showDataLabels,
        formatter: function (val: number) {
          return CatalogComponent.formatNumberGraph(val);
        },
        offsetY: -20,
        style: {
          fontSize: '10px',
          colors: ['#304758']
        }
      }
    };

    // Add chart events only if there's updated data
    if (hasUpdatedData && chartOptions.chart) {
      chartOptions.chart = {
        ...chartOptions.chart,
        events: {
          mounted: (chartContext: any) => {
            // Hide the second series (Updated) by default
            chartContext.hideSeries('Updated (Last 90 days)');
          }
        }
      };
    }

    return chartOptions;
  }

  getSeries(histData: { [year: string]: number }, histUpdated?: { [year: string]: number }): ApexAxisChartSeries {
    const series: any[] = [{
      name: 'Total Records',
      data: Object.values(histData)
    }];

    // Add updated records series if available and has data
    if (histUpdated && Object.keys(histUpdated).length > 0) {
      // Get all years from main histogram
      const allYears = Object.keys(histData);
      // Map updated data to match all years (fill with 0 if not present)
      const updatedData = allYears.map(year => histUpdated[year] || 0);

      series.push({
        name: 'Updated (Last 90 days)',
        data: updatedData
      });
    }

    return series;
  }

  getYears(histData: { [year: string]: number } | undefined, histUpdated: {    [year: string]: number  } | undefined): ApexXAxis {
    let years:string[] = []
    if(histUpdated)
      years = [...Object.keys(histUpdated)]
    if(histData)
      years = [...years, ...Object.keys(histData)];
    return {
      categories: Array.from(new Set(years.map(Number))).sort((a, b) => a - b),
      labels: {
        style: {
          fontSize: '11px'
        }
      }
    }
  }

  protected Object = Object

}
