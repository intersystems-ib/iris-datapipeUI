import { AfterViewInit, Component, ViewChild } from '@angular/core';

import { AuthService } from 'src/app/auth/auth.service';
import { PreferencesService } from 'src/app/shared/preferences.service';
import { DatapipeService } from '../datapipe.service';

import { ApexAxisChartSeries, ApexChart, ApexNonAxisChartSeries, ApexTitleSubtitle, ApexXAxis, ChartComponent } from 'ng-apexcharts';

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

/** chart. activity by status */
@ViewChild("chartActivityByStatus", {static: false}) chartActivityByStatus!: ChartComponent;
public chartActivityByStatusOptions: Partial<ChartOptions> | any;
public chartActivityByStatusReady: boolean = false;

/** filters that are using to query the server */
filters: any = {};

/** constructor */
constructor(
  public datapipeService: DatapipeService,
  public preferencesService: PreferencesService,
  public authService: AuthService,
) {
  this.setActivityByStatusOptions();
}

/** component init */
ngAfterViewInit() {
  setTimeout(() => {
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
}

/** get data from backend */
getData() {
  this.chartActivityByStatusReady = false;

  this.datapipeService.getInboxActivity(this.buildQuery()).subscribe((res) => {
    let pipeNames: any = [];
    let errorValues: any = [];
    let okValues: any = [];

    let pipes = Object.keys(res);
    
    pipes.forEach((pipe: any) => {
      errorValues.push(res[pipe]['errors'])
      okValues.push(res[pipe]['ok'])
      pipeNames.push(pipe);
    });

    let seriesStatus: any = [];
    seriesStatus.push({name: 'Errors', data: errorValues});
    seriesStatus.push({name: 'Ok', data: okValues});

    this.chartActivityByStatusOptions.series = seriesStatus;
    this.chartActivityByStatusOptions.xaxis = { categories: pipeNames };
    this.chartActivityByStatusOptions.colors = ['#df1c44','#39a275'];
    this.chartActivityByStatusReady = true;
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
