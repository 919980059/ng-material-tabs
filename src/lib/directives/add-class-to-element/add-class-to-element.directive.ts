import {Directive, ElementRef, Input, OnInit, Renderer2} from '@angular/core';

@Directive({
    selector: '[libAddClassToElement]'
})
export class AddClassToElementDirective implements OnInit {
    @Input('libAddClassToElement')
    class: string | string[];

    constructor(private element?: ElementRef<any>,
                private renderer?: Renderer2) {
    }

    ngOnInit(): void {
        if (this.class) {
            if (Array.isArray(this.class)) {
                this.class.forEach(cs => {
                    this.renderer.addClass(this.element.nativeElement, cs);
                });
            } else {
                this.renderer.addClass(this.element.nativeElement, this.class);
            }
        }
    }

}
