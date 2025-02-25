import { AfterViewInit, Component, ViewChild } from '@angular/core';

import { AuthService } from 'src/app/auth/auth.service';
import { PreferencesService } from 'src/app/shared/preferences.service';
import { DatapipeService } from '../datapipe.service';

import { ApexAxisChartSeries, ApexChart, ApexNonAxisChartSeries, ApexTitleSubtitle, ApexXAxis, ChartComponent, ChartType } from 'ng-apexcharts';
import { Router } from '@angular/router';

export interface ChartOptions {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  title: ApexTitleSubtitle;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements AfterViewInit {

/** flag for loading spinner */
loading!: boolean;

/** chart. activity by status */
@ViewChild("chartActivityByStatus", {static: false}) chartActivityByStatus!: ChartComponent;
public chartActivityByStatusOptions: Partial<ChartOptions> | any;
public chartActivityByStatusReady: boolean = false;
public chartActivityByStatusChart: Partial<ApexChart> | any;

/** chart. warnings */
@ViewChild("chartActivityWarning", {static: false}) chartActivityWarning!: ChartComponent;
public chartActivityWarningOptions: Partial<ChartOptions> | any;
public chartActivityWarningReady: boolean = false;
public chartActivityWarningChart: Partial<ApexChart> | any;

/** autocomplete fields */
filteredPipes: any[];

/** whether master data is completely loaded or not */
masterDataLoaded: boolean = false;

/** filters that are using to query the server */
filters: any = {};

/** widget (charts) width */
widgetWidth: string = "700";

/** constructor */
constructor(
  public datapipeService: DatapipeService,
  public preferencesService: PreferencesService,
  public authService: AuthService,
  private router: Router
) {
  this.setActivityByStatusOptions();
  this.setActivityWarningOptions();

  this.filteredPipes = [];
  this.datapipeService.findPipes(1, 100, {}).subscribe((res) => {
    this.filteredPipes = res.children;
    this.masterDataLoaded = true;
  });
}

/** component init */
ngAfterViewInit() {
  setTimeout(() => {
    this.filters = this.preferencesService.dashboard.filters;
    this.getData();
  });
}

/** set chart options */
setActivityByStatusOptions() {
  this.chartActivityByStatusOptions = {
    series: [],
    labels: [],
    colors: [],
    plotOptions: {
      bar: {
        horizontal: false,
        dataLabels: {
          total: {
            enabled: true,
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
    },
    tooltip: {
      enabled: true,
    },
    yaxis: {
      labels: {}
    },
    xaxis: {
    }
  }

  this.chartActivityByStatusChart = {
    type: 'bar', width: this.widgetWidth, stacked: true, toolbar: { show: true },
    events: {
      dataPointMouseEnter: function(event: any) {
        event.target.style.cursor = "pointer";
      },
      dataPointSelection: (event: any, chartContext: any, config: any) => {
        // series: e.g. Ok, InProgress, Errors
        const type = config.w.config.series[config.seriesIndex].name.replace(/\s/g, '');
        // xaxis category: e.g. HL7-ADT
        const pipe = config.w.config.xaxis.categories[config.dataPointIndex];
        // actual value
        const value = config.w.config.series[config.seriesIndex].data[config.dataPointIndex];

        // date filter values
        let from = this.datapipeService.dateToString(this.filters.UpdatedTSFrom) + "T" + this.filters.UpdatedTSFromTime;
        let to = this.datapipeService.dateToString(this.filters.UpdatedTSTo) + "T" + this.filters.UpdatedTSToTime;

        // open datapipe search some query parameters
        this.router.navigate(['datapipe'
        ], {
          queryParams: { pipe: pipe, type: type, from: from, to: to} 
        }).then();
      }
    }
  }
}

/** set chart options */
setActivityWarningOptions() {
  this.chartActivityWarningOptions = {
    series: [],
    labels: [],
    colors: [],
    plotOptions: {
      bar: {
        horizontal: false,
        dataLabels: {
          total: {
            enabled: false,
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
    },
    tooltip: {
      enabled: true,
    },
    yaxis: {
      labels: {}
    },
    xaxis: {
    }
  }

  this.chartActivityWarningChart = {
    type: 'bar', width: this.widgetWidth, stacked: true, toolbar: { show: true },
    events: {
      dataPointMouseEnter: function(event: any) {
        event.target.style.cursor = "pointer";
      },
      dataPointSelection: (event: any, chartContext: any, config: any) => {
        // series: e.g. Warnings
        const type = config.w.config.series[config.seriesIndex].name.replace(/\s/g, '');
        // xaxis category: e.g. REST-API (pipe)
        const pipe = config.w.config.xaxis.categories[config.dataPointIndex];
        // actual value
        const value = config.w.config.series[config.seriesIndex].data[config.dataPointIndex];

        // date filter values
        let from = this.datapipeService.dateToString(this.filters.UpdatedTSFrom) + "T" + this.filters.UpdatedTSFromTime;
        let to = this.datapipeService.dateToString(this.filters.UpdatedTSTo) + "T" + this.filters.UpdatedTSToTime;

        // open datapipe search some query parameters
        this.router.navigate(['datapipe'
        ], {
          queryParams: { pipe: pipe, type: type, from: from, to: to} 
        }).then();
      }
    }
  }
}

/** get data from backend */
getData() {
  this.loading = true;

  this.chartActivityByStatusReady = false;
  this.chartActivityWarningReady = false;

  this.datapipeService.getInboxActivity(this.buildQuery()).subscribe((res) => {
    let pipeNames: any = [];
    let errorValues: any = [];
    let inProgressValues: any = [];
    let okValues: any = [];
    let warningValues: any = [];

    let pipes = Object.keys(res);
    
    pipes.forEach((pipe: any) => {
      errorValues.push(res[pipe]['errors']);
      inProgressValues.push(res[pipe]['inprogress']);
      okValues.push(res[pipe]['ok']);
      warningValues.push(res[pipe]['warnings']);
      pipeNames.push(pipe);
    });

    let seriesStatus: any = [];
    seriesStatus.push({name: 'Errors', data: errorValues});
    seriesStatus.push({name: 'In Progress', data: inProgressValues});
    seriesStatus.push({name: 'Ok', data: okValues});
    this.chartActivityByStatusOptions.series = seriesStatus;
    this.chartActivityByStatusOptions.xaxis = { categories: pipeNames };
    this.chartActivityByStatusOptions.colors = ['#df1c44', '#17a2b8', '#39a275'];
    this.chartActivityByStatusReady = true;

    let seriesWarning: any = [];
    seriesWarning.push({name: 'Warnings', data: warningValues});
    this.chartActivityWarningOptions.series = seriesWarning;
    this.chartActivityWarningOptions.xaxis = { categories: pipeNames };
    this.chartActivityWarningOptions.colors = ['#ffc107'];
    this.chartActivityWarningReady = true;

    this.loading = false;
  });

}


/**
 * Submit search form
 */
search() {
  this.onChangeFilter();
}


/**
 * Search filters are modified
 * @param value
 */
onChangeFilter(): void {
  this.getData();
}


/**
 * Build server query from search filters
 */
buildQuery(): any {
  const query: any = {};
  for (const filter in this.filters) {
    if (this.filters.hasOwnProperty(filter)) {
      const value = this.filters[filter];
      if (value && value !== '') {
        query[filter] = this.filters[filter];
      }
    }
  }
  return query;
}


/**
 * Returns if the user can perform a search depending on the value of the filter fields
 */
canSearch(): boolean {
  return true;
}

}
