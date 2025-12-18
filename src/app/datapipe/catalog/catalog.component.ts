import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {Catalog, CatalogGraphResult, TableColumn, TableIndex} from '../datapipe.model';
import {DatapipeService} from '../datapipe.service';
import {ApexAxisChartSeries, ApexOptions, ApexXAxis} from "ng-apexcharts";
import {ToastService} from '../../shared/toast/toast.service';
import {Clipboard} from '@angular/cdk/clipboard';
import {getSearchRegex} from "./pipes/highlight-text.pipe";

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

  searchTree(text:string){
    this.catalogTree.forEach(
      catalog => this.search(catalog, text)
    )
    this.cdr.markForCheck();
  }

  search(catalog: Catalog, keywords: string): boolean {
    const regex = getSearchRegex(keywords)
    let includes = false;
    for (const prop in ['Category', 'Entity', 'EntityDescription', 'DataOrigins', 'Usage', 'Namespace', 'Table', 'Filter']) {
      if (this.hasAnySearchWord((catalog as any)[prop], regex)) {
        includes = true
        break
      }
    }
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

  hasAnySearchWord(string: string | undefined, regexp: RegExp): boolean {
    if (!string)
      return false
    return string.match(regexp) !== null
  }

  protected datapipeService = inject(DatapipeService)
  protected cdr = inject(ChangeDetectorRef)
  private clipboard = inject(Clipboard)
  private toastService = inject(ToastService)

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
          this.catalogTree = data.result;
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
    this.markLoading(this.catalogTree);
    // Reload catalog
    this.datapipeService.getCatalog().subscribe(
      data => {
        if (data.result) {
          setTimeout(() => {
            this.markLoading(this.catalogTree, false)
            this.cdr.markForCheck();
          }, 500)
          const flattened = this.flattenData(this.catalogTree)
          this.catalogTree = data.result
          this.refreshLevel(flattened, this.catalogTree)
          this.loadCategories(data.categories)
          this.cdr.markForCheck();
        }
      }
    );
  }

  markLoading(catalogs: Catalog[], loading: boolean = true) {
    catalogs.forEach(
      catalog => {
        catalog.refreshing = loading
        if (catalog.Children !== undefined) this.markLoading(catalog.Children, loading)
      }
    )
  }

  flattenData(catalogs: Catalog[]):{[id:string]:Catalog}
  {
    let res:{[id:string]:Catalog} = {}
    catalogs.forEach(
      catalog=>{
        res[catalog.Id+""] = catalog
        if(catalog.Children) res ={...this.flattenData(catalog.Children),...res}
      }
    )
    return res
  }

  refreshLevel(flattenedCatalogs: {[id:string]:Catalog}, backendData: Catalog[]) {
    backendData.forEach(
      catalog=>{
        const existingCatalog = flattenedCatalogs[catalog.Id+""]
        if(existingCatalog!==undefined){
          catalog.expanded = existingCatalog.expanded
          catalog.HistogramSeries = existingCatalog.HistogramSeries
          catalog.HistogramXaxis = existingCatalog.HistogramXaxis
          catalog.showHistogram = existingCatalog.showHistogram
          catalog.showColumns = existingCatalog.showColumns
          catalog.refreshing = existingCatalog.refreshing
          if(catalog.showHistogram){
            this.loadHistogram(catalog)
          }
        }
        if(catalog.Children) this.refreshLevel(flattenedCatalogs, catalog.Children)
      }
    )
    return backendData
  }


  /**
   * Toggle expand/collapse for an item
   */
  toggleExpand(item: Catalog): void {
    item.expanded = !item.expanded;
    this.cdr.markForCheck();
  }

  toggleEditMode(item: Catalog): void {
    item.isEditing = !item.isEditing;
    this.cdr.markForCheck();
  }

  saveEdit(item: Catalog): void {
    // Save logic will be implemented later
    this.datapipeService.updateEntry(item).subscribe(
      (result) => {
        if (result.categories != undefined) {
          item.isEditing = false;
          this.loadCategories(result.categories)
          item = Object.assign(item, {...result.result, Children: item.Children})
          this.cdr.markForCheck();
        } else {
          this.toastService.error("Error", "Table not found in the given namespace")
        }
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
      Category:{
        Id:-1,
        Name:''
      },
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

  loadColumns(item: Catalog, noCache: boolean = false) {
    const key = item.Namespace + '~' + item.Table;

    if (!this.catalogTablesColumns[key]) {
      this.datapipeService.getTableColumns(item.Id, noCache).subscribe(
        (tableInfo: any) => {
          if (tableInfo.error) {
            this.catalogTablesColumns[key] = [];
            this.catalogTableIndexes[key] = [];
          } else {
            this.catalogTablesColumns[key] = tableInfo.columns || [];
            this.catalogTableIndexes[key] = tableInfo.indexes || [];
          }
          this.cdr.markForCheck();
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


  protected chartOptions: Partial<ApexOptions> = {
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

  getSeries(histData: { [year: string]: number } | undefined, histUpdated?: {
    [year: string]: number
  }): ApexAxisChartSeries {
    const series: any[] = [{
      name: 'Total Records',
      data: histData ? Object.values(histData) : []
    }];

    // Add updated records series if available and has data
    if (histUpdated && Object.keys(histUpdated).length > 0) {
      // Get all years from main histogram
      const allYears = histData ? Object.keys(histData) : [];
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
    return {
      categories: histData ? Object.keys(histData) : (histUpdated ? histUpdated : []),
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
   * Clear column search
   */
  clearColumnSearch(item: Catalog): void {
    const key = item.Namespace + '~' + item.Table;
    this.columnSearchTerms[key] = '';
    this.cdr.markForCheck();
  }

  //Export related

  exportOptions: ExportDataOptions = GetExportOptionsDefaults()

  downloadFile(catalog: Catalog) {
    this.datapipeService.extractData(catalog.Id, this.exportOptions).subscribe((result: any) => {
      if (result.error !== undefined) {
        this.extractError = result.error
        this.cdr.markForCheck();
      } else {
        const blob = new Blob([result.content], {type: result.type});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = catalog.Table + "." + new Date().toLocaleString() + '.' + (this.exportOptions.fileType === "CSV" ? 'csv' : 'json');
        a.click();
        URL.revokeObjectURL(url);
      }
    })
  }

  extractError: string = ""

  validateAmount() {
    if (this.exportOptions.amount < 5) {
      this.exportOptions.amount = 5;
    }
    if (this.exportOptions.amount > 1000) {
      this.exportOptions.amount = 1000;
    }
    this.cdr.markForCheck();
  }

  deleteEntry(catalog: Catalog, index: number) {
    this.datapipeService.deleteEntry(catalog).subscribe(
      (result: any) => {
        this.catalogTree.splice(index, 1)
        this.cdr.markForCheck()
        this.loadCategories(result.categories)
      }
    );
  }

  resetTableInfo(item: Catalog) {
    delete this.catalogTablesColumns[item.Namespace + '~' + item.Table]
    delete this.catalogTableIndexes[item.Namespace + '~' + item.Table]
    this.cdr.markForCheck()
    this.loadColumns(item, true)
  }

  loadHistogram(catalog: Catalog) {
    if (!catalog.DoneLoadingGraph)
      this.datapipeService.getHistogram(catalog.Id).subscribe(
        (data: CatalogGraphResult | any) => {
          if (data.Histogram !== undefined || data.HistogramUpdated !== undefined) {
            catalog.Histogram = data.Histogram
            catalog.HistogramUpdated = data.HistogramUpdated
            catalog.HistogramSeries = this.getSeries(catalog.Histogram, catalog.HistogramUpdated)
            catalog.HistogramXaxis = this.getYears(catalog.Histogram, catalog.HistogramUpdated)
            catalog.ChartOptionsChart = {
              ...this.chartOptions.chart, events: {
                //Do not remove it is used
                mounted: (chartContext: any) => {
                  // Hide the second series (Updated) by default
                  try {
                    if (chartContext)
                      chartContext.hideSeries('Updated (Last 90 days)');
                  } catch (e) {///ignored
                  }

                }
              }
            }
            catalog.DoneLoadingGraph = true
            this.cdr.markForCheck()
          }
        }
      )
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
