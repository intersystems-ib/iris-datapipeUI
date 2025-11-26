import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Catalog } from '../datapipe.model';
import { DatapipeService } from '../datapipe.service';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogComponent implements OnInit {

  /** All catalog items */
  allCatalogItems: Catalog[] = [];

  /** Catalog items organized as tree structure */
  catalogTree: Catalog[] = [];

  /** Filtered and displayed catalog items */
  filteredCatalogTree: Catalog[] = [];

  /** Map to store loaded columns for each table */
  private tableColumnsMap = new Map<string, any[]>();

  /** Map to track which tables have columns visible */
  showColumnsMap = new Map<number, boolean>();

  /** Search term */
  private _searchTerm: string = '';

  /** Available categories */
  categories: string[] = [];

  /** Selected categories for filtering */
  selectedCategories: string[] = [];

  /** Show all histograms flag */
  showAllHistograms: boolean = false;
  showDescriptions = true;
  showTableInfo   = true;

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

  constructor(
    private datapipeService: DatapipeService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadCatalog();
  }

  /**
   * Load catalog data and build tree structure
   */
  loadCatalog(): void {
    this.datapipeService.getCatalog().subscribe(
      data => {
        this.allCatalogItems = data;
        this.extractCategories();
        this.buildTree();
        this.applyFilter();
        this.cdr.markForCheck();
      }
    );
  }

  /**
   * Extract unique categories from catalog items
   */
  extractCategories(): void {
    const categorySet = new Set<string>();
    this.allCatalogItems.forEach(item => {
      if (item.Category) {
        categorySet.add(item.Category);
      }
    });
    this.categories = Array.from(categorySet).sort();
  }

  /**
   * Build tree structure from flat catalog items (supports unlimited depth)
   */
buildTree(): void {
  // Mapa por Id y asegura array children
  const itemMap = new Map<number, Catalog>();
  this.allCatalogItems.forEach(item => {
    if (!item.children) item.children = [];
    itemMap.set(item.Id, item);
  });

  // Construye la jerarquía a partir de la lista plana
  this.catalogTree = [];
  this.allCatalogItems.forEach(item => {
    if (item.Subtypeof === null) {
      this.catalogTree.push(item);
    } else {
      const parent = itemMap.get(item.Subtypeof);
      if (parent) {
        parent.children!.push(item);
      }
    }
  });

  // Ordenar por Order (y nombre si empatan) en todos los niveles
  const byOrderThenName = (a: Catalog, b: Catalog) => {
    const ao = (a.Order ?? Number.MAX_SAFE_INTEGER);
    const bo = (b.Order ?? Number.MAX_SAFE_INTEGER);
    return ao - bo || a.Entity.localeCompare(b.Entity);
  };

  const sortDeep = (items: Catalog[]) => {
    items.sort(byOrderThenName);
    items.forEach(it => { if (it.children && it.children.length) sortDeep(it.children); });
  };

  sortDeep(this.catalogTree);
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
    item.showHistogram = !item.showHistogram;
    this.cdr.markForCheck();
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
    this.cdr.markForCheck();
  }

  cancelEdit(item: Catalog): void {
    // Cancel logic - restore original values if needed
    item.isEditing = false;
    this.cdr.markForCheck();
  }

  createNewRootEntity(event: Event): void {
    event.stopPropagation();

    // Create a new root entity with default values
    const newEntity: Catalog = {
      Id: this.getNextId(),
      Category: '',
      Subtypeof: null,
      Entity: 'New Entity',
      EntityDescription: '',
      Table: '',
      Filter: '',
      MDXTotal: '',
      MDXHistogram: '',
      MDXHistogramUpdated: '',
      Order: this.catalogTree.length,
      children: [],
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
      Id: this.getNextId(),
      Category: parent.Category,
      Subtypeof: parent.Id,
      Entity: 'New Subtype',
      EntityDescription: '',
      Table: '',
      Filter: '',
      MDXTotal: '',
      MDXHistogram: '',
      MDXHistogramUpdated: '',
      Order: parent.children ? parent.children.length : 0,
      children: [],
      expanded: false,
      isEditing: true // Start in edit mode
    };

    // Initialize children array if needed
    if (!parent.children) {
      parent.children = [];
    }

    // Add to parent's children and flat list
    parent.children.push(newChild);
    this.allCatalogItems.push(newChild);

    // Expand parent to show new child
    parent.expanded = true;

    // Refresh the view
    this.applyFilter();
    this.cdr.markForCheck();

    // Scroll to the new entity
    this.scrollToEntity(newChild.Id);
  }

  private getNextId(): number {
    // Get the maximum ID from all catalog items and add 1
    const maxId = this.allCatalogItems.reduce((max, item) => Math.max(max, item.Id), 0);
    return maxId + 1;
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
        columns => {
          this.tableColumnsMap.set(item.Table, columns);
          this.showColumnsMap.set(item.Id, true);
          this.cdr.markForCheck();
        },
        error => {
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

  hasColumns(item: Catalog): boolean {
    // Only show button if table has columns loaded or is ODS_FHIR.Encounter
    return item.Table === 'ODS_FHIR.Encounter' || this.tableColumnsMap.has(item.Table);
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

    // Apply to all items recursively
    const setHistogramVisibility = (items: Catalog[]) => {
      items.forEach(item => {
        item.showHistogram = this.showAllHistograms;
        if (item.children && item.children.length > 0) {
          setHistogramVisibility(item.children);
        }
      });
    };

    setHistogramVisibility(this.catalogTree);
    this.applyFilter();
  }

  /**
   * Expand all tree items
   */
  expandAll(): void {
    const expandItems = (items: Catalog[]) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          item.expanded = true;
          expandItems(item.children);
        }
      });
    };
    expandItems(this.catalogTree);
    this.applyFilter();
  }

  /**
   * Collapse all tree items
   */
  collapseAll(): void {
    const collapseItems = (items: Catalog[]) => {
      items.forEach(item => {
        item.expanded = false;
        if (item.children && item.children.length > 0) {
          collapseItems(item.children);
        }
      });
    };
    collapseItems(this.catalogTree);
    this.applyFilter();
  }

  /**
   * Check if a category is selected
   */
  isCategorySelected(category: string): boolean {
    return this.selectedCategories.includes(category);
  }

  /**
   * Toggle category selection
   */
  toggleCategory(category: string): void {
    const index = this.selectedCategories.indexOf(category);
    if (index >= 0) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(category);
    }
    this.applyFilter();
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
    let filtered = this.catalogTree;

    // Apply category filter
    if (this.selectedCategories.length > 0) {
      filtered = this.filterByCategory(filtered);
    }

    // Apply search filter
    if (this._searchTerm.trim()) {
      const term = this._searchTerm.toLowerCase();
      filtered = this.filterTree(filtered, term);
    }

    this.filteredCatalogTree = filtered;
    this.cdr.markForCheck();
  }

  /**
   * Filter tree by selected categories
   */
  private filterByCategory(items: Catalog[]): Catalog[] {
    const result: Catalog[] = [];

    for (const item of items) {
      const categoryMatches = this.selectedCategories.includes(item.Category);
      let filteredChildren: Catalog[] = [];

      if (item.children && item.children.length > 0) {
        filteredChildren = this.filterByCategory(item.children);
      }

      const childrenMatch = filteredChildren.length > 0;

      // Include if item's category matches or any children match
      if (categoryMatches || childrenMatch) {
        const itemCopy = { ...item };
        itemCopy.children = filteredChildren;
        // Keep the original expanded state, don't auto-expand
        itemCopy.expanded = item.expanded;
        result.push(itemCopy);
      }
    }

    return result;
  }

  /**
   * Recursively filter tree items (deep copy to avoid mutating originals)
   */
  private filterTree(items: Catalog[], term: string): Catalog[] {
    const result: Catalog[] = [];

    for (const item of items) {
      const matches = this.itemMatchesSearch(item, term);
      let filteredChildren: Catalog[] = [];

      if (item.children && item.children.length > 0) {
        filteredChildren = this.filterTree(item.children, term);
      }

      const childrenMatch = filteredChildren.length > 0;

      // If item or its children match, include it
      if (matches || childrenMatch) {
        // Create a shallow copy to avoid mutating original
        const itemCopy = { ...item };
        itemCopy.children = filteredChildren;
        // Keep the original expanded state, don't auto-expand
        itemCopy.expanded = item.expanded;
        result.push(itemCopy);
      }
    }

    return result;
  }

  /**
   * Check if item matches search term
   */
  itemMatchesSearch(item: Catalog, term: string): boolean {
    return item.Entity.toLowerCase().includes(term) ||
           item.EntityDescription.toLowerCase().includes(term) ||
           item.Table.toLowerCase().includes(term);
  }

  /**
   * Format large numbers (888, 34.5k, 3.5M)
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    } else {
      return num.toString();
    }
  }

  /**
   * Get chart options for histogram (memoized to avoid recreating on every change detection)
   */
  private chartOptionsCache = new Map<number, any>();

  getChartOptions(item: Catalog): any {
    if (!item.histogramData || item.histogramData.length === 0) {
      return null;
    }

    // Return cached options if available
    if (this.chartOptionsCache.has(item.Id)) {
      return this.chartOptionsCache.get(item.Id);
    }

    const formatNumber = this.formatNumber.bind(this);

    const options = {
      series: [{
        name: 'Records',
        data: item.histogramData.map(d => d.count)
      }],
      chart: {
        type: 'bar',
        height: 120,
        toolbar: {
          show: false
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
          return formatNumber(val);
        },
        offsetY: -20,
        style: {
          fontSize: '10px',
          colors: ['#304758']
        }
      },
      xaxis: {
        categories: item.histogramData.map(d => d.year.toString()),
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
            return formatNumber(val) + ' records';
          }
        }
      },
      colors: ['#3f51b5']
    };

    // Cache the options
    this.chartOptionsCache.set(item.Id, options);
    return options;
  }

  /**
   * Highlight search term in text
   */
  highlightSearch(text: string): string {
    if (!this.searchTerm.trim()) {
      return text;
    }

    const regex = new RegExp(`(${this.searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /** Devuelve el array de hermanos y el índice del item dentro de su rama */
private findSiblingsAndIndex(
  target: Catalog,
  current: Catalog[] = this.catalogTree,
  parent?: Catalog
): { siblings: Catalog[]; index: number; parent?: Catalog } | null {

  const idx = current.findIndex(x => x.Id === target.Id);
  if (idx >= 0) {
    return { siblings: current, index: idx, parent };
  }

  for (const it of current) {
    if (it.children && it.children.length) {
      const found = this.findSiblingsAndIndex(target, it.children, it);
      if (found) return found;
    }
  }
  return null;
}

/** Reglas de deshabilitado de botones */
canMoveUp(item: Catalog): boolean {
  const ref = this.findSiblingsAndIndex(item);
  return !!ref && ref.index > 0;
}

canMoveDown(item: Catalog): boolean {
  const ref = this.findSiblingsAndIndex(item);
  return !!ref && ref.index < ref.siblings.length - 1;
}

/** Mueve el item dentro de su rama y reindexa Order (0..n) */
moveItem(item: Catalog, direction: 'up' | 'down'): void {
  const ref = this.findSiblingsAndIndex(item);
  if (!ref) return;
  const { siblings, index } = ref;

  if (direction === 'up' && index === 0) return;
  if (direction === 'down' && index === siblings.length - 1) return;

  const swapWith = direction === 'up' ? index - 1 : index + 1;

  // Intercambia posiciones en la rama visible
  [siblings[index], siblings[swapWith]] = [siblings[swapWith], siblings[index]];

  // Reasigna Order secuencial en esa rama
  siblings.forEach((s, i) => { s.Order = i; });

  // También actualiza el Order en la **lista plana** para que no se pierda tras filtros/búsqueda
  this.syncOrdersBackToFlat();

  // Refresca vistas derivadas
  this.applyFilter();
  this.cdr.markForCheck();
}

/** Sincroniza los Order actuales del árbol (catalogTree) a la lista plana (allCatalogItems) */
private syncOrdersBackToFlat(): void {
  const mapById = new Map<number, Catalog>();
  this.allCatalogItems.forEach(x => mapById.set(x.Id, x));

  const walk = (items: Catalog[]) => {
    for (const it of items) {
      const flat = mapById.get(it.Id);
      if (flat) {
        flat.Order = it.Order;
        flat.Subtypeof = it.Subtypeof;
      }
      if (it.children && it.children.length) walk(it.children);
    }
  };
  walk(this.catalogTree);
}

}
