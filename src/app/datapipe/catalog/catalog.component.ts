import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {Catalog, CatalogGraphResult, Category, TableColumn, TableIndex} from '../datapipe.model';
import {CubeStatus, DatapipeService} from '../datapipe.service';
import {ApexAxisChartSeries, ApexOptions, ApexXAxis} from "ng-apexcharts";
import {ToastService} from '../../shared/toast/toast.service';
import {Clipboard} from '@angular/cdk/clipboard';
import {getSearchRegex} from "./pipes/highlight-search-text.pipe";
import {AuthService} from "../../auth/auth.service";

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogComponent implements OnInit {

  //////////////////////////////
  //CATEGORY////////////////////
  //////////////////////////////

  /** Available categories */
  categories: { [name: string]: Category } = {};

  ///False if no categories selected
  categoryFiltering = false;

  //////////////////////////////
  //////////////////////////////


  /** Catalog items organized as tree structure */
  catalogTree: Catalog[] = [];

  ///key must match {{namespace}}~{{table}}
  protected catalogTablesColumns: { [key: string]: TableColumn[] } = {}

  /** Map to store search terms for each table */
  protected columnSearchTerms: { [key: string]: string } = {}

  /** Map para guardar los índices por tabla: Namespace~Table */
  protected catalogTableIndexes: { [key: string]: TableIndex[] } = {};

  protected isLoading: boolean = true

  protected namespaces: string[] = [];

  protected searchResults: number = 0;

  protected canEdit = false;

  protected ackCube = false

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

  searchStringValue: string | undefined;

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

  private datapipeService = inject(DatapipeService)
  protected cdr = inject(ChangeDetectorRef)
  private clipboard = inject(Clipboard)
  private toastService = inject(ToastService)
  private authService = inject(AuthService)

  ngOnInit(): void {
    this.datapipeService.getNamespaces().subscribe(
      namespaces => this.namespaces = namespaces
    )
    this.loadCatalog();
    this.canEdit = this.authService.checkPermission('DP_ADMIN', 'U')
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
    this.markLoading(this.catalogTree);
    // Reload catalog, we mantain frontend properties, expansion, editing, etc by flattening the backend incoming data, and importing via the id
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

  flattenData(catalogs: Catalog[]): { [id: string]: Catalog } {
    let res: { [id: string]: Catalog } = {}
    catalogs.forEach(
      catalog => {
        res[catalog.Id + ""] = catalog
        if (catalog.Children) res = {...this.flattenData(catalog.Children), ...res}
      }
    )
    return res
  }

  refreshLevel(flattenedCatalogs: { [id: string]: Catalog }, backendData: Catalog[]) {
    backendData.forEach(
      catalog => {
        const existingCatalog = flattenedCatalogs[catalog.Id + ""]
        if (existingCatalog !== undefined) {
          catalog.expanded = existingCatalog.expanded
          catalog.histogramSeries = existingCatalog.histogramSeries
          catalog.histogramXaxis = existingCatalog.histogramXaxis
          catalog.showHistogram = existingCatalog.showHistogram
          catalog.showTreeMap = existingCatalog.showTreeMap
          catalog.showColumns = existingCatalog.showColumns
          catalog.refreshing = existingCatalog.refreshing
          if (catalog.showHistogram || catalog.showTreeMap) {
            this.loadGraphData(catalog)
          }
        }
        if (catalog.Children) this.refreshLevel(flattenedCatalogs, catalog.Children)
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
        if (result.error == undefined) {
          item.isEditing = false;
          this.loadCategories(result.categories)
          item = Object.assign(item, {...result.result, Children: item.Children})
          this.cdr.markForCheck();
        } else {
          this.toastService.error("Error", result.error.split('-')[0])
        }
      }
    )

  }

  openCubeModal(item: Catalog): void {
    this.syncTarget = item
    this.cubeOperationsModal = true
    this.cdr.markForCheck()
  }

  loadCategories(categories: Category[]) {
    categories.forEach(
      cat => {
        cat.Name = cat.Name.trim()
        if (this.categories[cat.Name])
          cat.selected = this.categories[cat.Name].selected
        else
          cat.selected = false
        if (cat.Attributes)
          cat.loadedAttributes = JSON.parse(cat.Attributes)
        this.categories[cat.Name] = cat

      }
    )
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
      Category: {
        Id: -1,
        Name: ''
      },
      Subtypeof: null,
      Entity: 'New Entity',
      EntityDescription: '',
      DataOrigins: '',
      Usage: '',
      Namespace: '',
      Cube: '',
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
      Cube: '',
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
    const newIndex = index + (direction === 'up' ? -1 : 1)
    this.datapipeService.reorder(item.Id, array[newIndex].Id).subscribe(
      () => {
        const item2 = array[newIndex]
        const order2 = item2.Order
        item2.Order = item.Order
        item.Order = order2
        array[index] = item2
        array[newIndex] = item
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

  deleteEntry(catalog: Catalog) {
    this.datapipeService.deleteEntry(catalog).subscribe(
      () => {
        this.refreshCatalog()
        this.cdr.markForCheck()
      }
    );
  }

  resetTableInfo(item: Catalog) {
    delete this.catalogTablesColumns[item.Namespace + '~' + item.Table]
    delete this.catalogTableIndexes[item.Namespace + '~' + item.Table]
    this.cdr.markForCheck()
    this.loadColumns(item, true)
  }

  loadGraphData(catalog: Catalog) {
    if (!catalog.doneLoadingGraph)
      this.datapipeService.getGraphData(catalog.Id).subscribe(
        (data: CatalogGraphResult | any) => {
          if (data.MDXError == undefined) {
            ///Load the histogram data and adapt it
            if (data.Histogram !== undefined || data.HistogramUpdated !== undefined) {
              catalog.Histogram = data.Histogram
              catalog.HistogramUpdated = data.HistogramUpdated
              catalog.histogramSeries = this.getSeries(catalog.Histogram, catalog.HistogramUpdated)
              catalog.histogramXaxis = this.getYears(catalog.Histogram, catalog.HistogramUpdated)
              catalog.chartOptionsChart = {
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
            }
            if (data.TreeMap) {
              catalog.TreeMap = data.TreeMap
              catalog.treeMapSeries = Object.keys(catalog.TreeMap!).map((key) => {
                return {
                  name: key,
                  data: [
                    {x: key, y: catalog.TreeMap![key]}
                  ]
                }
              })
            }
            catalog.doneLoadingGraph = true
            this.cdr.markForCheck()
            catalog.MDXError = {}
          } else {
            console.error(data)
            catalog.MDXError = data.MDXError
            catalog.histogramErrors = data.MDXError
            catalog.doneLoadingGraph = true
            this.cdr.markForCheck()
          }
        }
      )
    this.cdr.markForCheck()
  }

  exportItem(item: Catalog) {
    this.exportCatalogModal = true
    this.datapipeService.getById(item.Id, true).subscribe(
      data => this.exportedCatalogJSON = this.formatJSON(data.result)
    )
  }

  formatJSON(object: any) {
    return JSON.stringify(object, undefined, 4)
  }

  exportedCatalogJSON: string | undefined | null

  exportCatalogModal = false;

  copyData() {
    if (this.exportedCatalogJSON)
      this.clipboard.copy(this.exportedCatalogJSON)
  }

  //Import related
  importModal: boolean = false

  importData: string | undefined

  async pasteData() {
    try {
      this.importData = await navigator.clipboard.readText()
    } catch (e) {
      this.toastService.error("Not allowed to read clipboard, change the settings")
    }
    this.cdr.markForCheck()
  }

  importContent() {
    if (this.importData) {
      let data;
      try {
        data = JSON.parse(this.importData)
      } catch (e) {
        this.toastService.error("Not valid JSON")
        return
      }
      this.datapipeService.importCatalogs(data).subscribe(
        () => {
          this.importModal = false
          this.toastService.success("Done")
          this.refreshCatalog()
        }
      )
    } else {
      this.toastService.error("Can not import empty content")
    }

  }


  categoryChange(category: Category) {
    category.selected = !category.selected;
    this.categoryFiltering = false
    Object.values(this.categories).forEach(
      cat => {
        if (cat.selected === true) this.categoryFiltering = true
      }
    )
  }

  toggleHistogram(item: Catalog) {
    if ((item.MDXHistogram || item.MDXHistogramUpdated)) {
      item.showHistogram = !item.showHistogram;
      if (item.showTreeMap)
        item.showTreeMap = false
      if (item.showHistogram)
        this.loadGraphData(item)
    }
  }

  toggleTreeMap(item: any) {
    if (item.MDXTreeMap) {
      item.showTreeMap = !item.showTreeMap;
      if (item.showHistogram)
        item.showHistogram = false
      if (item.showTreeMap)
        this.loadGraphData(item)
    }
  }

  cubeOperationsModal = false;
  syncTarget: Catalog | null = null;
  cubeProgressRadius = 26;
  cubeProgressCircumference = 2 * Math.PI * this.cubeProgressRadius;
  cubeProgressTotalRows = 139000;
  private cubeProgressTimers = new Map<number, number>();
  private cubeProgressState = new Map<number, number>();
  private cubeStageDefs = [
    {label: 'Facts Delete', color: '#f59e0b'},
    {label: 'Facts Build', color: '#10b981'},
    {label: 'Indexes Build', color: '#3b82f6'},
  ];

  getCubeProgressStages(item: Catalog) {
    const overall = this.cubeProgressState.get(item.Id) ?? 0;
    const span = 100 / this.cubeStageDefs.length;
    return this.cubeStageDefs.map((stage, index) => {
      const start = span * index;
      const raw = ((overall - start) / span) * 100;
      const percent = Math.max(0, Math.min(100, Math.round(raw)));
      return {...stage, percent};
    });
  }

  getCircleDashoffset(percent: number): number {
    const safePercent = Math.max(0, Math.min(100, percent));
    return this.cubeProgressCircumference * (1 - safePercent / 100);
  }

  getStageRows(percent: number): number {
    const safePercent = Math.max(0, Math.min(100, percent));
    return Math.round(this.cubeProgressTotalRows * (safePercent / 100));
  }

  /*confirmSynchroniseCube() {
      this.startCubeProcess('Synchronise', 'Cube synchronised', 'sync')
  }

  confirmBuildCube() {
      this.startCubeProcess('Build', 'Cube build completed', 'build')
  }*/

  syncCube() {
    if (this.syncTarget && this.syncTarget.Id !== -1) {
      this.syncTarget.cubeOperationRunning = true
      this.startPrototypeProgress(this.syncTarget)
      this.datapipeService.syncCube(this.syncTarget.Id).subscribe({
          next: () => {
            this.closeCubeModal()
            this.toastService.info("Started the sync of the cube " + this.syncTarget!.Cube)
            this.pollCube(this.syncTarget!, "sync")
          }
        }
      )
    } else {
      this.toastService.error("Cannot sync this cube.")
    }
  }

  buildCube() {
    if (this.syncTarget && this.syncTarget.Id !== -1) {
      this.syncTarget.cubeOperationRunning = true
      this.startPrototypeProgress(this.syncTarget)
      this.datapipeService.buildCube(this.syncTarget.Id).subscribe({
          next: () => {
            this.closeCubeModal()
            this.toastService.info("Started the build of the cube " + this.syncTarget!.Cube)
            this.pollCube(this.syncTarget!, "build")
          }
        }
      )
    } else {
      this.toastService.error("Cannot build this cube.")
    }
  }

  pollCube(item:Catalog, type: "build"|"sync") {
    this.datapipeService.pollCube(item).subscribe({
        next: (status: CubeStatus) => {
          if (status.status === 'NA') {
            this.toastService.success("Completed " + type + " of cube " + item.Cube)
            item.cubeOperationRunning = false
            this.stopPrototypeProgress(item)
            this.cdr.markForCheck()
          }
        }
      }
    ).add(()=>{
      this.cdr.markForCheck()
    })
  }

  private startPrototypeProgress(item: Catalog) {
    if (item.Id === -1 || this.cubeProgressTimers.has(item.Id)) {
      return
    }
    this.cubeProgressState.set(item.Id, 0)
    const intervalId = window.setInterval(() => {
      const current = this.cubeProgressState.get(item.Id) ?? 0
      const next = current >= 100 ? 0 : current + 4
      this.cubeProgressState.set(item.Id, next)
      this.cdr.markForCheck()
    }, 250)
    this.cubeProgressTimers.set(item.Id, intervalId)
  }

  private stopPrototypeProgress(item: Catalog) {
    if (item.Id === -1) {
      return
    }
    const timer = this.cubeProgressTimers.get(item.Id)
    if (timer !== undefined) {
      clearInterval(timer)
      this.cubeProgressTimers.delete(item.Id)
    }
    this.cubeProgressState.delete(item.Id)
  }

  closeCubeModal() {
    this.cubeOperationsModal = false
    this.ackCube = false
    this.cdr.markForCheck()
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

export function markVal(value: any): any {
  switch (typeof value) {
    case typeof "string":
      return '<mark class="mark-blue">' + value + '</mark>'
    case "boolean":
      return '<mark class="mark-orange">' + value + '</mark>'
    case "number":
      return '<mark class="mark-red">' + value + '</mark>'
  }
  return value
}
