import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Catalog, TableColumn, TableIndex} from '../datapipe.model';
import {DatapipeService} from '../datapipe.service';
import {ApexAxisChartSeries, ApexOptions, ApexXAxis} from "ng-apexcharts";
import {ToastService} from '../../shared/toast/toast.service';
import {Clipboard} from '@angular/cdk/clipboard';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogComponent implements OnInit {

  //////////////////////////////
  //CATEGORY////////////////////
  //////////////////////////////

  /** Available categories */
  categories: string[] = [];

  ///False if no categories selected
  categoryFiltering = false;

  ///Object to check if categories are selected, should be loaded with the categories whenever they load
  selectedCategories: { [key: string]: boolean } = {};

  //////////////////////////////
  //////////////////////////////


  /** Catalog items organized as tree structure */
  catalogTree: Catalog[] = [];

  /** Count of filtered results */
  filteredResultsCount: number = 0;

  ///key must match {{namespace}}~{{table}}
  protected catalogTablesColumns: { [key: string]: TableColumn[] } = {}

  /** Map to store search terms for each table */
  protected columnSearchTerms: { [key: string]: string } = {}

  /** Map para guardar los índices por tabla: Namespace~Table */
protected catalogTableIndexes: { [key: string]: TableIndex[] } = {};

  /** Map to track which histograms are loading */
  loadingHistogramMap = new Map<number, boolean>();

  protected isLoading: boolean = true

  protected namespaces: string[] = [];

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

  callSearch = debounceAction((text: string) => {
    const keywords = text.split(/\. ,/)
    this.catalogTree.forEach(
      catalog => this.search(catalog, keywords)
    )
    this.cdr.markForCheck();
  }, 100);

  search(catalog: Catalog, keywords: string[]): boolean {
    let includes = false;
    if (!includes && this.hasAnySearchWord(catalog.Category, keywords)) includes = true
    if (!includes && this.hasAnySearchWord(catalog.Entity, keywords)) includes = true
    if (!includes && this.hasAnySearchWord(catalog.EntityDescription, keywords)) includes = true
    if (!includes && this.hasAnySearchWord(catalog.DataOrigins, keywords)) includes = true
    if (!includes && this.hasAnySearchWord(catalog.Usage, keywords)) includes = true
    if (!includes && this.hasAnySearchWord(catalog.Namespace, keywords)) includes = true
    if (!includes && this.hasAnySearchWord(catalog.Table, keywords)) includes = true
    if (!includes && this.hasAnySearchWord(catalog.Filter, keywords)) includes = true
    catalog.Children?.forEach(
      child => {
        if (this.search(child, keywords)) {
          includes = true
        }
      }
    )
    catalog.expanded = includes
    return includes
  }

  hasAnySearchWord(string: string | undefined, keywords: string[]): boolean {
    if (!string)
      return false
    return keywords.some(word =>
      string.toLowerCase().includes(word.trim().toLowerCase())
    )
  }

  /**
   * Clear search term
   */
  clearSearch(): void {
    this.applyFilter();
  }

  constructor(
    private datapipeService: DatapipeService,
    protected cdr: ChangeDetectorRef,
    private clipboard: Clipboard,
    private toastService: ToastService
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
    this.isLoading = true
    this.datapipeService.getCatalog().subscribe(
      data => {
        if (data.result) {
          this.catalogTree = this.calculateGraphInfo(data.result);
          // Trim categories to avoid whitespace issues
          this.loadCategories(data.categories)
          this.isLoading = false
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

          // Restore expansion state
          this.restoreExpansionState(this.catalogTree, expansionState);

          this.loadCategories(data.categories)

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
    item.isEditing = !item.isEditing;
    this.cdr.markForCheck();
  }

  saveEdit(item: Catalog): void {
    // Save logic will be implemented later
    item.isEditing = false;
    this.datapipeService.updateEntry(item).subscribe(
      (result) => {
        this.loadCategories(result.categories)
        item = Object.assign(item, {...result.result, Children: item.Children})
        this.cdr.markForCheck();
      }
    )

  }

  loadCategories(categories: string[]) {
    let selectedCategories: { [key: string]: boolean } = {}
    categories.forEach(
      cat => {
        cat = cat.trim()
        selectedCategories[cat] = this.selectedCategories[cat] !== undefined ? this.selectedCategories[cat] : false
      }
    )
    this.selectedCategories = selectedCategories
    this.categories = Object.keys(this.selectedCategories)
  }

  cancelEdit(item: Catalog, array: Catalog [], index: number): void {
    // Cancel logic - restore original values if needed
    item.isEditing = false;
    if (item.Id !== -1) {
      this.datapipeService.getById(item.Id).subscribe(
        (result: { result: Catalog }) => {
          Object.assign(item, result.result);
          //console.log(item)
          this.cdr.markForCheck();
        }
      )
    } else {
      array.splice(index, 1)
    }
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
    this.catalogTree.push(newChild);

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

loadColumns(item: Catalog) {
  const key = item.Namespace + '~' + item.Table;

  if (!this.catalogTablesColumns[key]) {
    this.datapipeService.getTableColumns(item.Id).subscribe(
      (tableInfo: any) => {
        if (tableInfo.error) {
          this.catalogTablesColumns[key] = [];
          this.catalogTableIndexes[key] = [];
        } else {
          this.catalogTablesColumns[key] = tableInfo.columns || [];
          this.catalogTableIndexes[key] = tableInfo.indexes || [];
        }
        this.cdr.markForCheck();
        //console.log(tableInfo);
      },
      (error: any) => {
        console.error('Error loading table columns:', error);
        const key = item.Namespace + '~' + item.Table;
        this.catalogTablesColumns[key] = [];
        this.catalogTableIndexes[key] = [];
        this.cdr.markForCheck();
      }
    );
  }
}

  // En CatalogComponent
  isCompact(item: Catalog): boolean {
    return !this.showDescriptions && !this.showTableInfo && !item.showHistogram;
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
    this.expandLevel(this.catalogTree)
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
    this.collapseLevel(this.catalogTree)
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
    if (num == null) return ''
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
  highlightSearch(text: string): string {
    return text
  }

  /*  if (!text) {
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
  }*/

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
      stacked: false,
      events: {
        mounted: (chartContext: any) => {
          // Hide the second series (Updated) by default
          if (chartContext)
            chartContext.hideSeries('Updated (Last 90 days)');
        }
      }
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

  getYears(histData: { [year: string]: number } | undefined, histUpdated: {
    [year: string]: number
  } | undefined): ApexXAxis {
    let years: string[] = []
    if (histUpdated)
      years = [...Object.keys(histUpdated)]
    if (histData)
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

  /**
   * Copy column name to clipboard and show success message
   * @param columnName - The column name to copy
   */
  copyToClipboard(columnName: string): void {
    const success = this.clipboard.copy(columnName);
    if (success) {
      this.toastService.success('Copied!', `Column "${columnName}" copied to clipboard`);
    } else {
      this.toastService.error('Copy Failed', 'Failed to copy to clipboard');
    }
  }

  /**
   * Copy table name to clipboard and show success message
   * @param tableName - The table name to copy
   */
  copyTableName(tableName: string): void {
    const success = this.clipboard.copy(tableName);
    if (success) {
      this.toastService.success('Copied!', `Table name "${tableName}" copied to clipboard`);
    } else {
      this.toastService.error('Copy Failed', 'Failed to copy to clipboard');
    }
  }

  /**
   * Get filtered columns based on search term
   */
  getFilteredColumns(item: Catalog): TableColumn[] {
    const key = item.Namespace + '~' + item.Table;
    const columns = this.catalogTablesColumns[key];

    if (!columns) {
      return [];
    }

    const searchTerm = this.columnSearchTerms[key];
    if (!searchTerm || searchTerm.trim() === '') {
      return columns;
    }

    const term = searchTerm.toLowerCase().trim();
    return columns.filter(column =>
      column.columnName.toLowerCase().includes(term) ||
      (column.description && column.description.toLowerCase().includes(term))
    );
  }

  getFilteredIndexes(item: Catalog): TableIndex[] {
    const key = item.Namespace + '~' + item.Table;
    const indexes = this.catalogTableIndexes[key] || [];

    const searchTerm = (this.columnSearchTerms[key] || '').trim().toLowerCase();
    if (!searchTerm) {
      return indexes;
    }

    return indexes.filter(idx => {
      const nameMatch = idx.name?.toLowerCase().includes(searchTerm);
      const descMatch = idx.description?.toLowerCase().includes(searchTerm);
      const propsMatch = idx.properties?.toLowerCase().includes(searchTerm);
      return nameMatch || descMatch || propsMatch;
    });
  }

  /**
   * Clear column search
   */
  clearColumnSearch(item: Catalog): void {
    const key = item.Namespace + '~' + item.Table;
    this.columnSearchTerms[key] = '';
    this.cdr.markForCheck();
  }


  /**
   * Highlight search term in text
   */
  highlightColumnText(text: string, item: Catalog): string {
    if (!text) {
      return '';
    }


    const key = item.Namespace + '~' + item.Table;
    const searchTerm = this.columnSearchTerms[key];

    if (!searchTerm || searchTerm.trim() === '') {
      return text;
    }

    const term = searchTerm.trim();
    // Escape special regex characters
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');

    return text.replace(regex, '<mark class="column-highlight">$1</mark>');
  }

  //Export related

  exportOptions: ExportDataOptions = GetExportOptionsDefaults()

  downloadFile(catalog: Catalog) {
    this.datapipeService.extractData(catalog.Id, this.exportOptions).subscribe((result: any) => {
      const blob = new Blob([result.content], {type: result.type});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = catalog.Table + "." + new Date().toLocaleString() + '.' + (this.exportOptions.fileType === "CSV" ? 'csv' : 'json');
      a.click();
      URL.revokeObjectURL(url);
    })
  }
  validateAmount() {
    if (this.exportOptions.amount < 5) {
      this.exportOptions.amount = 5;
    }
    if (this.exportOptions.amount > 1000) {
      this.exportOptions.amount = 1000;
    }
    this.cdr.markForCheck();
  } 

}

export interface ExportDataOptions {
  amount: number,
  fileType: "JSON" | "CSV",
  type: "LATEST" | "BALANCED",
  addHeader: boolean,
  addInfo: boolean,
  columns: []
}

export function GetExportOptionsDefaults(): ExportDataOptions {
  return {
    amount: 100,
    fileType: "CSV",
    type: "LATEST",
    addHeader: true,
    addInfo: false,
    columns: []
  }
}


export function debounceAction<T extends (...args: any[]) => any>(fn: T, delay = 200) {
  let timer: any;

  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

