import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, OnInit} from '@angular/core';
import {Catalog, CatalogGraphResult, Category, CubeStatus, TableColumn, TableIndex} from '../datapipe.model';
import {DatapipeService} from '../datapipe.service';
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
  protected columnSearchMatchCount: { [key: string]: number } = {}
  protected columnSearchActiveIndex: { [key: string]: number } = {}

  private columnSearchMatches: { [key: string]: HTMLElement[] } = {}
  private columnSearchActiveEl: { [key: string]: HTMLElement | null } = {}
  private columnCollectHandles: { [key: string]: number | null } = {}

  /** Map para guardar los índices por tabla: Namespace~Table */
  protected catalogTableIndexes: { [key: string]: TableIndex[] } = {};

  protected isLoading: boolean = true

  protected namespaces: string[] = [];

  protected searchResults: number = 0;

  protected canEdit = false;

  protected ackCube = false

  showDescriptions = false;
  showTableInfo = false;

  searchStringValue: string | undefined;
  searchMatchCount = 0;
  activeMatchIndex = 0;

  private searchMatches: HTMLElement[] = [];
  private activeMatchEl: HTMLElement | null = null;
  private activeMatchCard: HTMLElement | null = null;
  private collectMatchesHandle: number | null = null;
  private searchModeActive = false;
  private prevShowDescriptions: boolean | null = null;
  private prevShowTableInfo: boolean | null = null;

  mobileSearchOpen = false;

  private host = inject(ElementRef<HTMLElement>);

  toggleDescriptions(): void {
    this.showDescriptions = !this.showDescriptions;
    this.cdr.markForCheck();
  }

  toggleTableInfo(): void {
    this.showTableInfo = !this.showTableInfo;
    this.cdr.markForCheck();
  }

  onSearchInput(value: string): void {
    this.searchStringValue = value;
    const isActive = !!value?.trim();
    if (isActive) {
      if (!this.searchModeActive) {
        this.prevShowDescriptions = this.showDescriptions;
        this.prevShowTableInfo = this.showTableInfo;
      }
      this.searchModeActive = true;
      this.showDescriptions = true;
      this.showTableInfo = true;
      if (this.catalogTree) {
        this.expandVisible(this.catalogTree);
      }
    } else {
      this.searchModeActive = false;
      this.clearSearchNavigation();
      if (this.prevShowDescriptions !== null) {
        this.showDescriptions = this.prevShowDescriptions;
      }
      if (this.prevShowTableInfo !== null) {
        this.showTableInfo = this.prevShowTableInfo;
      }
      this.prevShowDescriptions = null;
      this.prevShowTableInfo = null;
    }
    this.cdr.markForCheck();
    this.scheduleCollectMatches(true);
  }

  clearSearch(input: HTMLInputElement): void {
    input.value = '';
    this.searchStringValue = '';
    this.searchModeActive = false;
    this.mobileSearchOpen = false;
    this.clearSearchNavigation();
    if (this.prevShowDescriptions !== null) {
      this.showDescriptions = this.prevShowDescriptions;
    }
    if (this.prevShowTableInfo !== null) {
      this.showTableInfo = this.prevShowTableInfo;
    }
    this.prevShowDescriptions = null;
    this.prevShowTableInfo = null;
    this.cdr.markForCheck();
  }

  openMobileSearch(): void {
    this.mobileSearchOpen = true;
    this.cdr.markForCheck();
  }

  goToNextMatch(): void {
    if (this.searchMatchCount === 0) return;
    const nextIndex = (this.activeMatchIndex + 1) % this.searchMatchCount;
    this.setActiveMatch(nextIndex, true);
  }

  goToPrevMatch(): void {
    if (this.searchMatchCount === 0) return;
    const prevIndex = (this.activeMatchIndex - 1 + this.searchMatchCount) % this.searchMatchCount;
    this.setActiveMatch(prevIndex, true);
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
          this.canEdit = this.authService.checkPermission('DP_ADMIN', 'U')
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
        this.refreshCatalogEntry(catalog, flattenedCatalogs[catalog.Id + ""])
        if (catalog.Children) this.refreshLevel(flattenedCatalogs, catalog.Children)
      }
    )
    return backendData
  }

  refreshCatalogEntry(catalog: Catalog, oldCatalog: Catalog) {
    if (oldCatalog !== undefined) {
      catalog.expanded = oldCatalog.expanded
      catalog.histogramSeries = oldCatalog.histogramSeries
      catalog.histogramXaxis = oldCatalog.histogramXaxis
      catalog.showHistogram = oldCatalog.showHistogram
      catalog.showTreeMap = oldCatalog.showTreeMap
      catalog.showColumns = oldCatalog.showColumns
      catalog.refreshing = oldCatalog.refreshing
      if (catalog.showHistogram || catalog.showTreeMap) {
        this.loadGraphData(catalog)
      }
    }
    return catalog
  }

  ///Call this to update a specific catalog entry when you do not have it's tree reference
  refreshCatalogEntryInTree(catalog: Catalog, treeReference: Catalog[] | undefined = this.catalogTree) {
    if (treeReference !== undefined) {
      ///Iterate the level
      treeReference.forEach(
        (cat, index) => {
          ///If matching entities it is the same catalogEntry
          if (cat.Entity === catalog.Entity) {
            ///Fetch it from backend
            this.datapipeService.getById(catalog.Id).subscribe(
              (result: { result: Catalog }) => {
                ///Update it using the tree reference
                const backCatalog = result.result
                backCatalog.Children = treeReference[index].Children
                treeReference[index] = this.refreshCatalogEntry(backCatalog, treeReference[index])
                this.cdr.markForCheck()
              }
            )

          } else if (cat.Children) {
            this.refreshCatalogEntryInTree(catalog, cat.Children)
          }
        }
      )
    }
  }


  /**
   * Toggle expand/collapse for an item
   */
  toggleExpand(item: Catalog): void {
    item.expanded = !item.expanded;
    this.cdr.markForCheck();
  }

  hasSyncError(item: Catalog): boolean {
    if (!item.LastSyncErrors) return false;
    return item.LastSyncErrors.trim() !== '0';
  }

  hasMdxError(item: Catalog): boolean {
    if (!item.MDXError) return false;
    if (Array.isArray(item.MDXError)) return item.MDXError.length > 0;
    return Object.keys(item.MDXError).some(
      key => (item.MDXError as { [key: string]: string[] })[key]?.length > 0
    );
  }

  hasAnyError(item: Catalog): boolean {
    return this.hasSyncError(item) || this.hasMdxError(item);
  }

  isSyncOrBuildStale(item: Catalog): boolean {
    const now = Date.now();
    const thresholdMs = 24 * 60 * 60 * 1000;
    const syncMs = this.getDateMs(item.LastSync);
    const buildMs = this.getDateMs(item.LastBuild);
    if (syncMs === null && buildMs === null) return false;
    // Use the most recent of sync or build
    const mostRecentMs = Math.max(syncMs ?? 0, buildMs ?? 0);
    return Math.abs(now - mostRecentMs) > thresholdMs;
  }

  getSyncBuildAgeTooltip(item: Catalog): string {
    const totalRaw = item.Total as any;
    const totalValue = typeof totalRaw === 'number' ? totalRaw : totalRaw?.Count;
    const total = totalValue != null ? totalValue.toLocaleString() : 'N/A';
    const now = Date.now();
    const syncMs = this.getDateMs(item.LastSync);
    const buildMs = this.getDateMs(item.LastBuild);

    let ageLine: string;
    // Determine which is more recent (larger ms = more recent)
    if (syncMs !== null && buildMs !== null) {
      if (syncMs >= buildMs) {
        ageLine = `Data age: ${this.formatAge(now - syncMs)} (Sync)`;
      } else {
        ageLine = `Data age: ${this.formatAge(now - buildMs)} (Build)`;
      }
    } else if (syncMs !== null) {
      ageLine = `Data age: ${this.formatAge(now - syncMs)} (Sync)`;
    } else if (buildMs !== null) {
      ageLine = `Data age: ${this.formatAge(now - buildMs)} (Build)`;
    } else {
      ageLine = 'Data age: N/A';
    }

    return `${total}\n${ageLine}`;
  }

  private formatAge(ms: number): string {
    if (!Number.isFinite(ms)) return 'N/A';
    // Use absolute value to handle clock drift between server and client
    const absMs = Math.abs(ms);
    if (absMs < 60000) return 'just now';
    const totalMinutes = Math.floor(absMs / 60000);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  }

  private parseMaybeDate(value: Date | string | number | undefined | null): Date | null {
    const ms = this.getDateMs(value);
    return ms === null ? null : new Date(ms);
  }

  private getDateMs(value: Date | string | number | undefined | null): number | null {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();

    if (typeof value === 'number') {
      const ms = value < 1e12 ? value * 1000 : value;
      return Number.isNaN(ms) ? null : ms;
    }

    const raw = String(value).trim();
    if (!raw || raw.toLowerCase() === 'n/a') return null;
    const cleaned = raw.replace(/[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '');

    const parsed = Date.parse(cleaned);
    if (!Number.isNaN(parsed)) return parsed;
    const normalized = cleaned.replace(/\s+/g, ' ').replace(' ', 'T');
    const parsedIso = Date.parse(normalized);
    if (!Number.isNaN(parsedIso)) return parsedIso;

    const isoMatch = normalized.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z)?$/
    );
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]) - 1;
      const day = Number(isoMatch[3]);
      const hour = Number(isoMatch[4]);
      const minute = Number(isoMatch[5]);
      const second = Number(isoMatch[6]);
      const msRaw = isoMatch[7] ? isoMatch[7].slice(0, 3).padEnd(3, '0') : '0';
      const ms = Number(msRaw);
      const utc = Date.UTC(year, month, day, hour, minute, second, ms);
      return Number.isNaN(utc) ? null : utc;
    }

    const noColonMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
    if (noColonMatch) {
      const year = Number(noColonMatch[1]);
      const month = Number(noColonMatch[2]) - 1;
      const day = Number(noColonMatch[3]);
      const hour = Number(noColonMatch[4]);
      const minute = Math.min(Number(noColonMatch[5]), 59);
      const second = Math.min(Number(noColonMatch[6]), 59);
      const utc = Date.UTC(year, month, day, hour, minute, second, 0);
      return Number.isNaN(utc) ? null : utc;
    }

    // Fallback: pull numeric parts even if separators are non-standard
    const partsMatch = cleaned.match(/(\d{4})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})\D?(\d{2})/);
    if (partsMatch) {
      const year = Number(partsMatch[1]);
      const month = Number(partsMatch[2]) - 1;
      const day = Number(partsMatch[3]);
      const hour = Number(partsMatch[4]);
      const minute = Math.min(Number(partsMatch[5]), 59);
      const second = Math.min(Number(partsMatch[6]), 59);
      const utc = Date.UTC(year, month, day, hour, minute, second, 0);
      return Number.isNaN(utc) ? null : utc;
    }

    const digits = cleaned.match(/\d/g);
    if (digits && digits.length >= 14) {
      const year = Number(digits.slice(0, 4).join(''));
      const month = Number(digits.slice(4, 6).join('')) - 1;
      const day = Number(digits.slice(6, 8).join(''));
      const hour = Number(digits.slice(8, 10).join(''));
      const minute = Math.min(Number(digits.slice(10, 12).join('')), 59);
      const second = Math.min(Number(digits.slice(12, 14).join('')), 59);
      const utc = Date.UTC(year, month, day, hour, minute, second, 0);
      return Number.isNaN(utc) ? null : utc;
    }

    if (/^\d+$/.test(cleaned)) {
      const num = Number(cleaned);
      if (!Number.isFinite(num)) return null;
      return num < 1e12 ? num * 1000 : num;
    }

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cleaned)) {
      const parsedAlt = Date.parse(cleaned.replace(' ', 'T'));
      return Number.isNaN(parsedAlt) ? null : parsedAlt;
    }

    const usMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (usMatch) {
      const month = Number(usMatch[1]) - 1;
      const day = Number(usMatch[2]);
      const year = Number(usMatch[3]);
      const hour = Number(usMatch[4] || 0);
      const minute = Number(usMatch[5] || 0);
      const second = Number(usMatch[6] || 0);
      const date = new Date(year, month, day, hour, minute, second);
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }

    return null;
  }

  private expandVisible(level: Catalog[]) {
    level.forEach(entry => {
      if (!this.isItemVisible(entry)) return;
      entry.expanded = true;
      if (entry.Children) this.expandVisible(entry.Children);
    });
  }

  isItemVisible(item: Catalog): boolean {
    if (!this.categoryFiltering) return true;
    const categoryName = item.Category?.Name;
    if (!categoryName) return true;
    const category = this.categories?.[categoryName];
    return !category || !!category.selected;
  }

  hasVisibleChildren(item: Catalog): boolean {
    if (!item.Children || item.Children.length === 0) return false;
    return item.Children.some(child => this.isItemVisible(child));
  }

  private scheduleCollectMatches(resetIndex: boolean) {
    if (this.collectMatchesHandle !== null) {
      clearTimeout(this.collectMatchesHandle);
    }
    this.collectMatchesHandle = window.setTimeout(() => {
      this.collectMatchesHandle = null;
      this.collectMatches(resetIndex);
    }, 0);
  }

  private collectMatches(resetIndex: boolean) {
    const root = this.host.nativeElement;
    const marks = Array.from(root.querySelectorAll('mark.searchMark')) as HTMLElement[];
    this.searchMatches = marks.filter(mark => {
      const card = mark.closest('.catalog-card') as HTMLElement | null;
      return !!card && !card.hasAttribute('hidden');
    });
    this.clearMatchCardClasses();
    this.searchMatches.forEach(mark => {
      const card = mark.closest('.catalog-card') as HTMLElement | null;
      if (card) card.classList.add('search-has-match');
    });
    this.searchMatchCount = this.searchMatches.length;
    this.searchResults = this.searchMatchCount;
    if (this.searchMatchCount === 0) {
      this.clearActiveMatch();
      this.activeMatchIndex = 0;
      this.cdr.markForCheck();
      return;
    }
    const targetIndex = resetIndex ? 0 : Math.min(this.activeMatchIndex, this.searchMatchCount - 1);
    this.setActiveMatch(targetIndex, resetIndex);
  }

  private clearSearchNavigation() {
    this.searchMatches = [];
    this.searchMatchCount = 0;
    this.searchResults = 0;
    this.activeMatchIndex = 0;
    this.clearMatchCardClasses();
    this.clearActiveMatch();
  }

  private clearActiveMatch() {
    if (this.activeMatchEl) {
      this.activeMatchEl.classList.remove('active');
      this.applyActiveStyle(this.activeMatchEl, false);
      this.activeMatchEl = null;
    }
    if (this.activeMatchCard) {
      this.activeMatchCard.classList.remove('search-active-card');
      this.activeMatchCard = null;
    }
  }

  private clearMatchCardClasses() {
    const root = this.host.nativeElement;
    root.querySelectorAll('.catalog-card.search-has-match').forEach((card: Element) => {
      card.classList.remove('search-has-match');
    });
  }

  private setActiveMatch(index: number, scroll: boolean) {
    if (!this.searchMatches.length) return;
    this.clearActiveMatch();
    this.activeMatchIndex = index;
    const el = this.searchMatches[index];
    el.classList.add('active');
    this.applyActiveStyle(el, true);
    this.activeMatchEl = el;
    const card = el.closest('.catalog-card') as HTMLElement | null;
    if (card) {
      card.classList.add('search-active-card');
      this.activeMatchCard = card;
    }
    if (scroll) {
      el.scrollIntoView({behavior: 'smooth', block: 'center'});
    }
    this.cdr.markForCheck();
  }

  private applyActiveStyle(el: HTMLElement, active: boolean) {
    if (active) {
      el.style.background = '#ffb300';
      el.style.boxShadow = '0 0 0 3px rgba(255, 179, 0, 0.55)';
      el.style.borderRadius = '2px';
    } else {
      el.style.background = '';
      el.style.boxShadow = '';
      el.style.borderRadius = '';
    }
  }

  getMdxErrorTooltip(item: Catalog): string {
    if (!item.MDXError) return '';
    if (Array.isArray(item.MDXError)) {
      return `MDX Error:\n${item.MDXError.join('\n')}`;
    }
    const entries = Object.entries(item.MDXError);
    const lines = entries.flatMap(([key, msgs]) => msgs?.map(msg => `${key}: ${msg}`) || []);
    return lines.length ? `MDX Error:\n${lines.join('\n')}` : 'MDX Error';
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
    this.clearColumnSearchNavigation(key);
    this.cdr.markForCheck();
  }

  onColumnSearchInput(item: Catalog, container: HTMLElement, value: string): void {
    const key = item.Namespace + '~' + item.Table;
    this.columnSearchTerms[key] = value;
    if (!value || !value.trim()) {
      this.clearColumnSearchNavigation(key);
      this.cdr.markForCheck();
      return;
    }
    this.scheduleCollectColumnMatches(key, container, true);
  }

  goToNextColumnMatch(item: Catalog, container: HTMLElement): void {
    const key = item.Namespace + '~' + item.Table;
    const count = this.columnSearchMatchCount[key] || 0;
    if (count === 0) return;
    const nextIndex = ((this.columnSearchActiveIndex[key] || 0) + 1) % count;
    this.setActiveColumnMatch(key, nextIndex, container, true);
  }

  goToPrevColumnMatch(item: Catalog, container: HTMLElement): void {
    const key = item.Namespace + '~' + item.Table;
    const count = this.columnSearchMatchCount[key] || 0;
    if (count === 0) return;
    const current = this.columnSearchActiveIndex[key] || 0;
    const prevIndex = (current - 1 + count) % count;
    this.setActiveColumnMatch(key, prevIndex, container, true);
  }

  private scheduleCollectColumnMatches(key: string, container: HTMLElement, resetIndex: boolean) {
    const handle = this.columnCollectHandles[key];
    if (handle !== undefined && handle !== null) {
      clearTimeout(handle);
    }
    this.columnCollectHandles[key] = window.setTimeout(() => {
      this.columnCollectHandles[key] = null;
      this.collectColumnMatches(key, container, resetIndex);
    }, 0);
  }

  private collectColumnMatches(key: string, container: HTMLElement, resetIndex: boolean) {
    const marks = Array.from(container.querySelectorAll('mark.searchMark')) as HTMLElement[];
    this.columnSearchMatches[key] = marks;
    this.columnSearchMatchCount[key] = marks.length;
    if (marks.length === 0) {
      this.clearActiveColumnMatch(key);
      this.columnSearchActiveIndex[key] = 0;
      this.cdr.markForCheck();
      return;
    }
    const targetIndex = resetIndex ? 0 : Math.min(this.columnSearchActiveIndex[key] || 0, marks.length - 1);
    this.setActiveColumnMatch(key, targetIndex, container, resetIndex);
  }

  private clearColumnSearchNavigation(key: string) {
    this.columnSearchMatchCount[key] = 0;
    this.columnSearchActiveIndex[key] = 0;
    this.columnSearchMatches[key] = [];
    this.clearActiveColumnMatch(key);
  }

  private clearActiveColumnMatch(key: string) {
    const active = this.columnSearchActiveEl[key];
    if (active) {
      this.applyColumnActiveStyle(active, false);
      active.classList.remove('column-active');
    }
    this.columnSearchActiveEl[key] = null;
  }

  private setActiveColumnMatch(key: string, index: number, container: HTMLElement, scroll: boolean) {
    const matches = this.columnSearchMatches[key] || [];
    if (matches.length === 0) return;
    this.clearActiveColumnMatch(key);
    this.columnSearchActiveIndex[key] = index;
    const el = matches[index];
    el.classList.add('column-active');
    this.applyColumnActiveStyle(el, true);
    this.columnSearchActiveEl[key] = el;
    if (scroll) {
      el.scrollIntoView({behavior: 'smooth', block: 'center'});
    }
    this.cdr.markForCheck();
  }

  private applyColumnActiveStyle(el: HTMLElement, active: boolean) {
    if (active) {
      el.style.background = '#ffb300';
      el.style.boxShadow = '0 0 0 3px rgba(255, 179, 0, 0.55)';
      el.style.borderRadius = '2px';
    } else {
      el.style.background = '';
      el.style.boxShadow = '';
      el.style.borderRadius = '';
    }
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
  protected cubeStageDefs = [
    {label: 'Facts Delete', color: '#f59e0b', key: "delete"},
    {label: 'Facts Build', color: '#10b981', key: "facts"},
    {label: 'Indexes Build', color: '#3b82f6', key: "indices"},
  ];

  syncCube() {
    if (this.syncTarget && this.syncTarget.Id !== -1) {
      this.syncTarget.cubeOperationRunning = true
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

  pollCube(item: Catalog, type: "build" | "sync") {
    this.datapipeService.pollCube(item).subscribe({
        next: (status: CubeStatus) => {
          if (status.status === 'NA') {
            this.toastService.success("Completed " + type + " of cube " + item.Cube)
            this.refreshCatalogEntryInTree(item)
            item.cubeOperationRunning = false
          }
          item.cubeStatus = status
          this.cdr.markForCheck()
        }
      }
    ).add(() => {
      this.cdr.markForCheck()
    })
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
