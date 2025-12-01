import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    inject,
    Input,
    Output
} from "@angular/core";
import {animate, style, transition, trigger} from "@angular/animations";
import {NgClass, NgIf, NgStyle} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";

@Component({
    selector: 'bos-msg-toast',
    templateUrl: './toast.component.html',
    styleUrls: ['./toast.component.css'],
    imports: [
        NgClass,
        NgIf,
        MatIconModule,
        NgStyle
    ],
    animations: [
        trigger('toastAnimation', [
            transition(':enter', [
                style({opacity: 0, transform: 'translateX(100%) translateY(-20px)'}),
                animate('300ms ease-out', style({opacity: 1, transform: 'translateX(0) translateY(0)'})),
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({opacity: 0, transform: 'translateX(100%) translateY(-20px)'})),
            ]),
        ])
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})

export class ToastComponent {

    private changeDetectorRef = inject(ChangeDetectorRef)

    @Input()
    set config(config: ToastConfig | undefined) {
        this._config = config
    }

    public _config: ToastConfig | undefined;

    @Output()
    done = new EventEmitter<number>();

    @Input()
    set height(height: string) {
        this._height = height
        this.changeDetectorRef.detectChanges()
    }

    @Input()
    id!:number

    _height: string = '1'

    @Input()
    set startTimer(start: boolean) {
        if (start && this._config?.duration) {
            setTimeout(() => {
                if (this._config) {
                    this.removeFunc()
                }
            }, this._config.duration)
        }
    }

    removeFunc() {
        this._config = undefined
        this.changeDetectorRef.detectChanges()
        this.done.emit(this.id)
    }


    getMaterialIcon(type: ToastType): string {
        switch (type) {
            case 'success':
                return 'task_alt';
            case 'error':
                return 'error';
            case 'warning':
                return 'warning';
            case 'info':
                return 'info';
            default:
                return 'info';
        }
    }


}

export interface ToastConfig {
    type: ToastType;
    title: string;
    message?: string;
    duration: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}


export type ToastType = 'success' | 'error' | 'warning' | 'info';
