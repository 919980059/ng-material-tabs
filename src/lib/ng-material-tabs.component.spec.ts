import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {NgMaterialTabsComponent} from './ng-material-tabs.component';
import {CommonModule} from '@angular/common';
import {MatTabsModule} from '@angular/material/tabs';
import {MatIconModule} from '@angular/material/icon';
import {TranslateModule} from '@ngx-translate/core';
import {DirectivesModule} from './directives/directives.module';
import {FlexModule} from '@angular/flex-layout';
import {OverlayModule} from '@angular/cdk/overlay';
import {MatRippleModule} from '@angular/material/core';
import {RouterTestingModule} from '@angular/router/testing';

describe('NgMaterialTabsComponent', () => {
    let component: NgMaterialTabsComponent;
    let fixture: ComponentFixture<NgMaterialTabsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [NgMaterialTabsComponent],
            imports: [
                CommonModule,
                MatTabsModule,
                MatIconModule,
                TranslateModule.forRoot(),
                DirectivesModule,
                RouterTestingModule,
                FlexModule,
                OverlayModule,
                MatRippleModule
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NgMaterialTabsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
