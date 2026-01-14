import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from "@angular/material/expansion";
import {MatButton} from "@angular/material/button";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from "@angular/material/table";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatIcon} from "@angular/material/icon";
import {MatInput} from "@angular/material/input";
import {MatToolbar} from "@angular/material/toolbar";
import {Category} from "../../datapipe.model";
import {DatapipeService} from "../../datapipe.service";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {DebouncedInputDirective} from "../debounced-input.directive";
import {NgIf, NgStyle} from "@angular/common";
import {SuggestionInputComponent} from "../suggestion-input/suggestion-input.component";
import {ToastService} from "../../../shared/toast/toast.service";

@Component({
  selector: 'app-catalog-categories',
  standalone: true,
  imports: [
    FormsModule,
    MatAccordion,
    MatButton,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatFormField,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatInput,
    MatLabel,
    MatRow,
    MatRowDef,
    MatTable,
    MatToolbar,
    MatProgressSpinner,
    MatHeaderCellDef,
    DebouncedInputDirective,
    NgIf,
    SuggestionInputComponent,
    NgStyle
  ],
  templateUrl: './catalog-categories.component.html',
  styleUrl: './catalog-categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogCategoriesComponent implements OnInit {

  protected toastService = inject(ToastService);

  categories: Category[] | undefined;

  resources: string[] = []

  filter: string = "";

  anyChanges: boolean = false;

  private datapipeService = inject(DatapipeService);

  protected cdr = inject(ChangeDetectorRef)

  ngOnInit() {
    this.datapipeService.getResources().subscribe(
      (result: { resources: string[] }) => {
        if (result.resources)
          this.resources = result.resources
      })
    this.search()
  }

  search() {
    this.anyChanges = false
    this.datapipeService.getCategories(this.filter).subscribe(
      (result: any | ({ categories: Category[] })) => {
        result.categories.forEach((cat: Category) => {
          cat.loadedAttributes = cat.Attributes ? JSON.parse(cat.Attributes) : {}
        })
        if (result.categories)
          this.categories = result.categories
        this.cdr.markForCheck()
      }
    )
  }

  create() {
    if (this.categories) {
      const cat = JSON.parse(JSON.stringify(this.categories))
      cat.unshift(
        {
          Id: -1,
          Name: "Category name",
          loadedAttributes: {}
        }
      )
      this.categories = cat
      this.cdr.markForCheck()
      this.anyChanges = true
    }
  }

  displayedColumns = ['Name', 'Resource', 'Color', 'BackgroundColor', 'DeleteCategory']


  save() {
    this.categories!.forEach(cat => {
      cat.Attributes = JSON.stringify(cat.loadedAttributes)
    })
    this.datapipeService.updateCategories(this.categories!).subscribe(
      (val: any) => {
        if (val != undefined && val.error) {
          this.toastService.error(val.error)
        } else {
          this.anyChanges = false
          this.cdr.markForCheck()
        }
      }
    )
  }

  deleteCategory(Id: any) {
    this.datapipeService.deleteCategory(Id).subscribe(
      (val: any) => {
        if (val != undefined && val.error) {
          this.toastService.error(val.error)
        } else {
          this.anyChanges = false
          this.search()
          this.cdr.markForCheck()
        }
      }
    )
  }
}
