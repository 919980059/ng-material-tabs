import {NgModule} from '@angular/core';
import {AddClassToElementDirective} from './add-class-to-element/add-class-to-element.directive';


@NgModule({
    declarations: [
        AddClassToElementDirective,
    ],
    imports: [],
    exports: [AddClassToElementDirective]
})
export class DirectivesModule {
}
