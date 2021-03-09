# NgMaterialTabs

### This is an Angular component similar to a browser tab. By listening to router events, combined with the MatTabs component in Angular Material, it can correctly handle the logic of opening and closing route, and can cache and switch back and forth of the page.It's based on Angular's RouteReuseStrategy.You can visit an example to see all the features.

#### [demo on github](https://919980059.github.io/widzz-angular-demo/#/login)

#### [demo on gitee](http://widzz.gitee.io/widzz-angular-demo/#/login)

#### [code in github](https://github.com/919980059/ng-material-tabs.git)

#### us/pw: widzz/widzz12345

##### Function Description

##### 1. Open a new tab when accessing a new route,

##### 2. Click on the existing tab to access the cached route, or visit any of the same routes back to the same tab,

##### 3. Click the delete icon to close the tab. If it is the current route, it will go to the previous tab. The right-click menu supports close current, close left, close right and close others. The current route will automatically adapt to jump according to the closing situation, and the last tab cannot shut down.

##### 4. Supports all route menus. When opening dozens of tabs (including route cache), there is no major performance problem, but only a little memory usage.

#### dependencies  Earlier versions may be support because there are not too many weird packages

#### I build it with v10, and test it with v8,it works well.

#### It may work with earlier versions like v7.

```
  "@angular/common": ">=8.0.0",
     "@angular/core": "^>=8.0.0",
     "@angular/cdk": ">=8.0.0",
     "@angular/material": ">=8.0.0",
     "rxjs": ">=6.0.0"
    "@ngx-translate/core": ">=11.0.0"  // for i18n
```

### Tips

##### 1.RouteReuse: Route will be cached when you leave,and Angular can restore it when you back to the route.

##### 2.Tabs: You have opened lots of routes like you open lots of websites in the browser.Tabs can tell you what you have opened,and you can go back to them due to these tabs.

### Usages

#### 1 The default position of the tag of this tab is absolute, but you can modify its position and width through **[ngStyle]**.

#### 2 The style of each label can be controlled by passing into the global style class array through **[classes]**

#### npm install ng-material-tabs  and import NgMaterialModule to your module

#### use the component

```
 // In xxxModule . Default ExceptUrl for not to reuse routes is ['/login']
//  you can provide an array of exceptUrls that not to reuse routes.
import:[
NgMaterialTabsModule,
...
]
// or provide an array

import:[
NgMaterialTabsModule.forChild(['/login', '/apps/bpmn'])
...
]
 e.g.:
 <!--TABS-->
                <lib-ng-material-tabs [active]="active" (tabsChange)="onTabsChange"  [ngStyle]="{'display':config.layout.tabs.hidden?'none':'block','width':'calc(100% - 341px)'}"
                        [ngStyle.lt-lg]="{'left':'56px'}"
                        [classes]="['h-64']" [menuTitles]=['Close','CloseLeft','CloseRight','CloseOthers']></lib-ng-material-tabs>
                <!--/ TABS-->
                
                xxx.component.ts
                active:any={index:0};
```

##### [active] is the active tab index of tabs ,it must be an object with property "index",and then you can use active whenever you want,and it will be the right index of tabs while tabs change.

##### [menuTitles] is the titles for the right mouse button menu or translateKey in @ngx-translate.Default Values is like example above

##### [classes] is the classes for the tab element.

##### (tabsChange) is events when tabs change, it will emit {action:'initial'|'openNew'|'openExist'|'close'|'closeLeft'|'closeRight'|'closeOthers',tabs:this.tabs,active:this.active.index}\

##### you can do something according to the action types and get tabs currently.

##### (tabInitial),(openNew),(openExist),(close),(closeLeft),(closeRight),(closeOthers) are detailed Events in tabsChange.
##### Every Detailed Event will return {tabs:this.tabs,active:this.active.index}.

#### Import the CustomReuseStrategy to the AppModule. If not provide, it will not reuse routes with tabs , every route will be new.

```
import {CustomReuseStrategy} from 'ng-material-tabs';


 providers:
        [
            // The Strategy of RouteReuse.
            {provide: RouteReuseStrategy, useClass: CustomReuseStrategy}
         ....
        ]
```

#### In RouterConfig

```
        {
            // The total url is '/apps/strategy' will be a title in tab.
            // And as a key of routeCache in CustomReuseStrategy.
           
            path: 'strategy',  
            loadChildren: () => import('./marketing-strategy/marketing-strategy.module').then(m => m.MarketingStrategyModule),
           
            // Needed.  Will be a title in tabs 
            data: {  
               // translateKey in @ngx-translate/core or just {title:'list'} 
                translate: 'nav.marketingStrategy.list',  
            }
        },
        // new
        {
            path: 'strategyCreate',
            loadChildren: () => import('./marketing-strategy/edit-strategy/edit-strategy.module').then(m => m.EditStrategyModule),
            data: {
                translate: 'nav.marketingStrategy.create',
            }
        },
        // edit
        {

            // Just use restful url for the key in CustomReuseStrategy
            // Traditional ?params='' are not supported,it will be the same tab.
            path: 'strategy/edit/:id',  
            loadChildren: () => import('./marketing-strategy/edit-strategy/edit-strategy.module').then(m => m.EditStrategyModule),
            data: {
                translate: 'nav.marketingStrategy.edit',
            }
        },

```

#### Go Back. Like url  'list/edit' to 'list' ,if you do something,the tab should  be closed, and the 'list' route should be refreshed.If you do nothing,it's just go back,the edit tab will be closed,this routeCache of edit should be deleted,but this 'list' will restore from routeCache.

```
// true:I do something changed to the data,then i need to close create/edit and dont't cache them when i visit theme again,then refresh list with no routeCache.
// false: I do nothing changed to the data,i just need to close create/edit and dont't cache them when i visit theme again.

e.g.  history go back
cancel(flag?) {
        sessionStorage.setItem('routeReload', JSON.stringify({reload: flag}));
        history.back();
    }
```

##### Then it will close the current tab and go back to its parent/previous url.

### Something Important When Reuse Routes And Components

#### When you use the event listeners or rxjs subscription in a component or subcomponent, the component will not be destroyed when the route is reused, so the listeners and subscriptions still work.

#### If these listeners and subscriptions depend on the view or will change the view , like listen to the window resize event and do something to some elements with their width or other similar properties,bug will happen.

#### So please handle it yourself with the situation you are not in the view of the component and cannot modify the view of the reuse route, otherwise it will cause some unexpected problems.

#### e.g.

```
  // get wdith of columns when window resize
    getColumnWidth() { 
        // if element width ===0  it's not in current view.
        if (this.dataTable.element.offsetWidth === 0) {
            return;
        }
        let columnWidth;
        if (this.overPanel) {
            columnWidth = this.dataTable.element.offsetWidth - (50 + 50 * (this.checkbox ? 1 : 0));
        } else {
            columnWidth = this.dataTable.element.offsetWidth - (50 + 50 * ((this.hasDetail ? 1 : 0) + (this.checkbox ? 1 : 0) + (this.hasStatistics ? 1 : 0)));
        }
        this.columns.forEach(column => column.width = columnWidth / this.columns.length);
    }
```

##### If you want some help, please email 919980059@qq.com,or find me on wechat with 919980059.
