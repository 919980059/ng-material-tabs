import {Component, EventEmitter, HostListener, Input, OnInit, Optional, Output, Renderer2} from '@angular/core';
import {ResolveEnd, Router, RouteReuseStrategy} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {filter, map} from 'rxjs/operators';
import {CustomReuseStrategy} from './custom-reuse-strategy';
import {fuseAnimations} from './animations';

@Component({
    selector: 'lib-ng-material-tabs',
    template: `
        <nav id="routeTabs" mat-tab-nav-bar color="accent"
             [ngClass]="{'mat-tab-header-pagination-controls-enabled':tabPagination}">
            <a class="route-tab secondary-text user-select-none" cdkOverlayOrigin #trigger="cdkOverlayOrigin"
               (contextmenu)="onContextMenu($event,tab,i)"
               [libAddClassToElement]="classes" mat-tab-link *ngFor="let tab of tabs;let i=index"
               [active]="active.index === i" [ngClass]="{'tab-active':active.index===i}">
                <!--right click menus panel-->
                <ng-template
                        cdkConnectedOverlay [cdkConnectedOverlayHasBackdrop]="true"
                        [cdkConnectedOverlayOffsetX]="position.x"
                        [cdkConnectedOverlayOffsetY]="position.y"
                        [cdkConnectedOverlayBackdropClass]="'backdrop-transparent'"
                        [cdkConnectedOverlayOrigin]="trigger" (backdropClick)="onBackdropClick(tab)"
                        [cdkConnectedOverlayOpen]="tab.openMenu"
                >
                    <ul class="menu-list" [@animate]="{value:'*',params:{scale:0.1,duration:'200ms',delay:'0ms'}}">
                        <li *ngFor="let menu of menus" matRipple (click)="menuClose(menu.id,tab,i)"
                            class="dark-box-shadow-hover cursor-pointer" fxLayout="row" fxLayoutAlign="start center">
                            {{menu.title|translate}}
                        </li>
                    </ul>
                </ng-template>
                <div fxLayout="row" fxLayoutAlign="space-around center" [routerLink]="tab.url"
                     [ngClass]="{'theme-color':active.index===i}"
                     (click)="active.index = i">
                    <span>{{tab.translate ? (tab.translate|translate) : tab.title}}</span>
                </div>
                <!--空白处也可点击切换-->
                <!--click empty part in tab-->
                <div fxLayout="column" fxLayoutAlign="start start">
                    <div fxFlex="1 1 auto" [routerLink]="tab.url"
                         (click)="active.index = i"></div>
                    <mat-icon (click)="closeTab(i)" [ngStyle]="{'visibility':tab.canDelete?'':'hidden'}"
                              class="mat-icon-20 warn-color">close
                    </mat-icon>
                    <div fxFlex="1 1 auto" [routerLink]="tab.url"
                         (click)="active.index = i"></div>
                </div>
            </a>
        </nav>
    `,
    styleUrls: ['./ng-material-tabs.component.scss'],
    animations: fuseAnimations
})
export class NgMaterialTabsComponent implements OnInit {

    @Input()
    classes: string | string[];
    @Input()
    menuTitles: any[] = [];

    tabs: Tab[] = []; // 标签  // tabs
    @Input()
    active: any = {index: 0}; // 激活标签 // activeIndex
    customReuseStrategy: CustomReuseStrategy;
    currentState: number; // 当前页面history的状态   // historyState in current route

    sourceMenus = []; // 右键菜单  // right click menus
    menus = []; // 展示菜单  // show menus filtered by sourceMenus
    position = {x: 0, y: 0}; // position of right click menus panel

    tabPagination = false; // 展示控制条  // control scroll bar of tabs

    // emit Events when tabs change   {action:'initial'|'openNew'|'openExist'|'close'|'closeLeft'|'closeRight'|'closeOthers',tabs:this.tabs}
    @Output()
    tabsChange: EventEmitter<any> = new EventEmitter<any>();
    // Detailed events
    @Output()
    tabInitial: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    openNew: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    openExist: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    close: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    closeLeft: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    closeRight: EventEmitter<any> = new EventEmitter<any>();
    @Output()
    closeOthers: EventEmitter<any> = new EventEmitter<any>();


    constructor(private router: Router,
                @Optional() private translate: TranslateService,
                private renderer2: Renderer2,
                @Optional() private routeReuseStrategy: RouteReuseStrategy) {
        if (sessionStorage.getItem('routeTabs')) {
            this.tabs = JSON.parse(sessionStorage.getItem('routeTabs'));
            this.fixPaginationStatus();
        }
        if (sessionStorage.getItem('activeIndex')) {
            this.active.index = JSON.parse(sessionStorage.getItem('activeIndex'));
        }
        this.onRouterEvents();
        this.customReuseStrategy = routeReuseStrategy as CustomReuseStrategy;
        this.getSourceMenus();
        this.onLanguageChange();
    }


    /**
     * 语言切换时需要去除其他路由复用
     * Other route reuse needs to be removed during language switching
     *
     */
    onLanguageChange() {
        if (this.translate) {
            this.translate.onLangChange.subscribe(() => {
                if (this.customReuseStrategy) {
                    this.customReuseStrategy.routeHandles.clear();
                }
            });
        }
    }

    // 回退事件   on goBack
    @HostListener('window:popstate', ['$event'])
    onHistory(event) {
        if (event.state && event.state.navigationId === this.currentState) {
            this.closeTab(this.active.index);
        }
    }

    // on wheel
    @HostListener('wheel', ['$event'])
    onWheel(event) {
        const pagerBefore = document.getElementsByClassName('mat-tab-header-pagination-before').item(0) as HTMLElement;
        const pagerAfter = document.getElementsByClassName('mat-tab-header-pagination-after').item(0) as HTMLElement;
        // .mat-tab-header-pagination-disabled 禁用状态的样式 到头了
        if (pagerAfter.style.display !== 'none' && pagerBefore.style.display !== 'none') {
            if (event.deltaY > 0 && !pagerAfter.classList.contains('mat-tab-header-pagination-disabled')) {
                pagerAfter.click();
            } else if (event.deltaY < 0 && !pagerBefore.classList.contains('mat-tab-header-pagination-disabled')) {
                pagerBefore.click();
            }
        }
    }

    /**
     * 修复标签控制条
     * fix tabs scroll when there are few tags.
     */
    fixPaginationStatus() {
        setTimeout(() => {
            if (document.getElementById('routeTabs')) {
                const tabsListWidth = document.getElementById('routeTabs').clientWidth;
                const tabElementWidths = Array.from(document.getElementsByClassName('route-tab')).map(element => element.clientWidth);
                let tabTotalWidth = 0;
                tabElementWidths.forEach(width => tabTotalWidth += width);
                this.tabPagination = tabTotalWidth > tabsListWidth;
            }
        });
    }

    /**
     * 右键菜单
     * right click menu
     * @param event
     * @param tab
     * @param i
     */
    onContextMenu(event, tab, i) {
        event.preventDefault();
        let aElement = event.target;
        while (aElement.tagName !== 'A') {
            aElement = aElement.parentNode;
        }
        // 计算面板偏移距离
        const rect = aElement.getBoundingClientRect();
        this.position.y = event.pageY - (rect.top + rect.height);
        this.position.x = event.pageX - rect.left;

        // 打开菜单 关闭其他菜单
        if (this.tabs.length > 1) {
            tab.openMenu = true;
            if (i === 0) {
                this.menus = this.sourceMenus.filter(menu => {
                    return menu.id !== 'left';
                });
            } else if (i === this.tabs.length - 1) {
                this.menus = this.sourceMenus.filter(menu => {
                    return menu.id !== 'right';
                });
            } else {
                this.menus = this.sourceMenus;
            }
        } else {
            this.menus = [];
        }
    }

    /**
     * 获取原始菜单
     * init source menus
     */
    getSourceMenus() {
        if (this.menuTitles.length === 4) {
            this.sourceMenus = [
                {id: 'current', title: this.menuTitles[0]},
                {id: 'left', title: this.menuTitles[1]},
                {id: 'right', title: this.menuTitles[2]},
                {id: 'other', title: this.menuTitles[3]}
            ];
        } else {
            this.sourceMenus = [
                {id: 'current', title: 'Close'},
                {id: 'left', title: 'CloseLeft'},
                {id: 'right', title: 'CloseRight'},
                {id: 'other', title: 'CloseOthers'}
            ];
        }
    }

    /**
     * 右键菜单关闭标签
     * close tabs with 4 ways
     * @param id
     * @param t
     * @param i
     */
    menuClose(id, t, i) {
        t.openMenu = false;
        switch (id) {
            case 'current': {
                this.closeTab(i);
                break;
            }
            case 'left': {
                const preLength = this.tabs.length;
                this.tabs = this.tabs.filter((tab, index) => {
                    if (index < i) {
                        const deleteKey = this.tabs[index].url;
                        if (this.customReuseStrategy) {
                            this.customReuseStrategy.routeHandles.delete(deleteKey);
                        }
                    }
                    return i <= index;
                });
                this.tabsChange.emit({action: 'closeLeft', tabs: this.tabs, active: this.active.index});
                this.closeLeft.emit({tabs: this.tabs, active: this.active.index});
                const currLength = this.tabs.length;
                this.canDelete();
                if (this.active.index < i) {
                    this.active.index = 0;
                    this.router.navigate([this.tabs[this.active.index].url]);
                } else {
                    this.active.index = this.active.index - (preLength - currLength);
                }
                break;
            }
            case 'right': {
                this.tabs = this.tabs.filter((tab, index) => {
                    if (index > i) {
                        const deleteKey = this.tabs[index].url;
                        if (this.customReuseStrategy) {
                            this.customReuseStrategy.routeHandles.delete(deleteKey);
                        }
                    }
                    return index <= i;
                });
                this.tabsChange.emit({action: 'closeRight', tabs: this.tabs, active: this.active.index});
                this.closeRight.emit({tabs: this.tabs, active: this.active.index});
                this.canDelete();
                if (this.active.index > i) {
                    this.active.index = this.tabs.length - 1;
                    this.router.navigate([this.tabs[this.active.index].url]);

                }
                break;
            }
            case 'other': {
                this.tabs = this.tabs.filter((tab, index) => {
                    if (index !== i) {
                        const deleteKey = this.tabs[index].url;
                        if (this.customReuseStrategy) {
                            this.customReuseStrategy.routeHandles.delete(deleteKey);
                        }
                    }
                    return i === index;
                });
                this.tabsChange.emit({action: 'closeOthers', tabs: this.tabs, active: this.active.index});
                this.closeOthers.emit({tabs: this.tabs, active: this.active.index});
                this.canDelete();
                if (this.active.index !== i) {
                    this.active.index = 0;
                    this.router.navigate([this.tabs[this.active.index].url]);
                } else {
                    this.active.index = 0;
                }
                break;
            }
        }
        this.fixPaginationStatus();
    }


    /**
     * 背板点击关闭菜单
     * close right menu panel when click backdrop
     *
     * @param tab
     */
    onBackdropClick(tab) {
        tab.openMenu = false;
    }

    /**
     * 监听路由事件来进行选项卡处理
     * Listen for routing events and handle tabs
     */
    onRouterEvents() {
        // 路由解析完成
        // on resolveEnd
        this.router.events.pipe(filter<ResolveEnd>(event => {
            return event instanceof ResolveEnd;
        }), map(event => {
            let activatedRoute = (event as any).state._root;
            while (activatedRoute.children && activatedRoute.children[0]) {
                activatedRoute = activatedRoute.children[0];
            }
            const data = activatedRoute.value.data;
            return {
                id: event.id,
                url: event.state.url.split('?')[0], // 保留 非?传参url  // remove the content after ?
                title: data.title ? data.title : '',
                translate: data.translate ? data.translate : ''
            };
        })).subscribe(event => {
            if (history.state && history.state.navigationId) {
                this.currentState = history.state.navigationId;
            }
            // 登录界面为登出或初始化
            // login page are not included in tabs
            if (event.url.toLowerCase().includes('login')) {
                this.tabs = [];
                this.tabsChange.emit({action: 'initial', tabs: this.tabs, active: this.active.index});
                this.tabInitial.emit({tabs: this.tabs, active: this.active.index});
                this.active.index = 0;
                return;
            }
            //    打开新的标签
            // open new tab not exist
            if (!this.tabs.find(tab => tab.url === event.url)) {
                const tab = new Tab();
                tab.id = event.id;
                tab.title = event.title;
                tab.translate = event.translate;
                tab.url = event.url;
                const activeIndex = this.tabs.push(tab) - 1;
                this.tabsChange.emit({action: 'openNew', tabs: this.tabs, active: this.active.index});
                this.openNew.emit({tabs: this.tabs, active: this.active.index});
                // 多个退出再进来会存在出现控制条的bug
                // There will be a control bar bug when multiple exits come in again
                setTimeout(() => {
                    this.active.index = activeIndex;
                });
                this.fixPaginationStatus();
                // if (this.tabs.length === 1) {
                //     this.renderer2.removeClass(document.getElementById('routeTabs'), 'mat-tab-header-pagination-controls-enabled');
                // }
            } else { // 打开已有标签  // open tab exist
                this.active.index = this.tabs.findIndex(tab => tab.url === event.url);
                this.tabsChange.emit({action: 'openExist', tabs: this.tabs, active: this.active.index});
                this.openExist.emit({tabs: this.tabs, active: this.active.index});
            }
            this.canDelete();
        });
    }

    /**
     * 关闭标签
     * Logic to handle closing tags
     * @param index
     */
    closeTab(index) {
        // 删除的在选中之后
        // tabs need to delete are after active tab
        const deleteKey = this.tabs[index].url;
        if (index > this.active.index) {
            this.tabs = this.tabs.filter((item, i) => i !== index);
            if (this.customReuseStrategy) {
                this.customReuseStrategy.routeHandles.delete(deleteKey);
            }
            this.canDelete();
            // 之前  // before
        } else if (index < this.active.index) {
            this.tabs = this.tabs.filter((item, i) => i !== index);
            this.active.index = this.active.index - 1;
            if (this.customReuseStrategy) {
                this.customReuseStrategy.routeHandles.delete(deleteKey);
            }
            this.canDelete();
            // 删除的就是选中  // or just active tab
        } else {
            this.tabs = this.tabs.filter((item, i) => i !== index);
            this.active.index = index - 1 > 0 ? index - 1 : this.tabs.length - 1;
            this.router.navigate([this.tabs[this.active.index].url]).then(() => {
                this.canDelete();
                if (this.customReuseStrategy) {
                    this.customReuseStrategy.routeHandles.delete(deleteKey);
                }
            });
        }
        this.tabsChange.emit({action: 'close', tabs: this.tabs, active: this.active.index});
        this.close.emit({tabs: this.tabs, active: this.active.index});
    }

    /**
     * 判断是否可以删除 剩余一个不让关闭标签
     * Judge whether it can be deleted  The remaining one is not allowed to close the label
     */
    canDelete() {
        if (this.tabs.length === 1) {
            this.tabs[0].canDelete = false;
        } else {
            this.tabs.forEach(tab => {
                tab.canDelete = true;
            });
        }
        sessionStorage.setItem('routeTabs', JSON.stringify(this.tabs));
        sessionStorage.setItem('activeIndex', JSON.stringify(this.active.index));
    }

    ngOnInit() {
    }

}

export class Tab {
    id?: any;   // id
    title: string;  // title
    openMenu = false;  // menu open status
    translate?: string;  // translate key for i18n in @ngx-translate
    url: string;  // route path
    canDelete = true;  // The remaining one is not allowed to close the label

    constructor() {
    }

}
