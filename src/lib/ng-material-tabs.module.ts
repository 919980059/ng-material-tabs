import {ModuleWithProviders, NgModule, Optional, SkipSelf} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {FlexModule} from '@angular/flex-layout';
import {EXCEPT_URLS} from './custom-reuse-strategy';
import {OverlayModule} from '@angular/cdk/overlay';
import {MatIconModule} from '@angular/material/icon';
import {MatTabsModule} from '@angular/material/tabs';
import {MatRippleModule} from '@angular/material/core';
import {NgMaterialTabsComponent} from './ng-material-tabs.component';
import { DirectivesModule } from './directives/directives.module';


@NgModule({
    declarations: [NgMaterialTabsComponent],
    exports: [
        NgMaterialTabsComponent
    ],
    imports: [
        CommonModule,
        MatTabsModule,
        MatIconModule,
        TranslateModule,
        RouterModule,
        DirectivesModule,
        FlexModule,
        OverlayModule,
        MatRippleModule
    ],
    providers: [
    ]
})
export class NgMaterialTabsModule {
    constructor(@Optional() @SkipSelf() parentModule: NgMaterialTabsModule) {
    }

    static forChild(exceptUrls: string[]): ModuleWithProviders<NgMaterialTabsModule> {
        return {
            ngModule: NgMaterialTabsModule,
            providers: [
                {
                    provide: EXCEPT_URLS,
                    useValue: exceptUrls
                }
            ]
        };
    }
}
