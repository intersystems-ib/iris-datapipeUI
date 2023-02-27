export class Alert {
    type: AlertType = AlertType.Success;
    message: string = '';
    alertId: string = '';
    keepAfterRouteChange: boolean = false;

    constructor(init?:Partial<Alert>) {
        Object.assign(this, init);
    }
}

export enum AlertType {
    Success,
    Error,
    Info,
    Warning
}