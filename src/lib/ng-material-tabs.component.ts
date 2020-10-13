import {Component, HostListener, Input, OnInit, Optional, Renderer2} from '@angular/core';
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
               [active]="activeIndex === i" [ngClass]="{'tab-active':activeIndex===i}">
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
                            {{menu.title}}
                        </li>
                    </ul>
                </ng-template>
                <div fxLayout="row" fxLayoutAlign="space-around center" [routerLink]="tab.url"
                     [ngClass]="{'theme-color':activeIndex===i}"
                     (click)="activeIndex = i">
                    <span>{{tab.translate ? (tab.translate|translate) : tab.title}}</span>
                </div>
                <!--空白处也可点击切换-->
                <div fxLayout="column" fxLayoutAlign="start start">
                    <div fxFlex="1 1 auto" [routerLink]="tab.url"
                         (click)="activeIndex = i"></div>
                    <mat-icon (click)="closeTab(i)" [ngStyle]="{'visibility':tab.canDelete?'':'hidden'}"
                              class="mat-icon-20 warn-color">close
                    </mat-icon>
                    <div fxFlex="1 1 auto" [routerLink]="tab.url"
                         (click)="activeIndex = i"></div>
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

    tabs: Tab[] = []; // 标签
    activeIndex: number; // 激活标签
    customReuseStrategy: CustomReuseStrategy;
    currentState: number; // 当前页面history的状态

    sourceMenus = []; // 右键菜单
    menus = []; // 展示菜单
    position = {x: 0, y: 0};

    tabPagination = false; // 展示控制条

    constructor(private router: Router,
                @Optional() private translate: TranslateService,
                private renderer2: Renderer2,
                @Optional() private routeReuseStrategy: RouteReuseStrategy) {
        if (sessionStorage.getItem('routeTabs')) {
            this.tabs = JSON.parse(sessionStorage.getItem('routeTabs'));
            this.fixPaginationStatus();
        }
        if (sessionStorage.getItem('activeIndex')) {
            this.activeIndex = JSON.parse(sessionStorage.getItem('activeIndex'));
        }
        this.onRouterEvents();
        this.customReuseStrategy = routeReuseStrategy as CustomReuseStrategy;
        this.getSourceMenus();
        this.onLanguageChange();
    }


    /**
     * 语言切换时需要去除其他路由复用
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

    // 回退事件
    @HostListener('window:popstate', ['$event'])
    onHistory(event) {
        if (event.state && event.state.navigationId === this.currentState) {
            this.closeTab(this.activeIndex);
        }
    }

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
     */
    getSourceMenus() {
        this.sourceMenus = [
            {id: 'current', title: '关闭'},
            {id: 'left', title: '关闭左侧标签'},
            {id: 'right', title: '关闭右侧标签'},
            {id: 'other', title: '关闭其他标签'}
        ];
    }

    /**
     * 右键菜单关闭标签
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
                const currLength = this.tabs.length;
                this.canDelete();
                if (this.activeIndex < i) {
                    this.activeIndex = 0;
                    this.router.navigate([this.tabs[this.activeIndex].url]);
                } else {
                    this.activeIndex = this.activeIndex - (preLength - currLength);
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
                this.canDelete();
                if (this.activeIndex > i) {
                    this.activeIndex = this.tabs.length - 1;
                    this.router.navigate([this.tabs[this.activeIndex].url]);

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
                this.canDelete();
                if (this.activeIndex !== i) {
                    this.activeIndex = 0;
                    this.router.navigate([this.tabs[this.activeIndex].url]);
                } else {
                    this.activeIndex = 0;
                }
                break;
            }
        }
        this.fixPaginationStatus();
    }


    /**
     * 背板点击关闭菜单
     * @param tab
     */
    onBackdropClick(tab) {
        tab.openMenu = false;
    }

    /**
     * 监听路由事件来进行选项卡处理
     */
    onRouterEvents() {
        // 路由解析完成
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
                url: event.state.url.split('?')[0], // 保留restful url
                title: data.title ? data.title : '',
                translate: data.translate ? data.translate : ''
            };
        })).subscribe(event => {
            if (history.state && history.state.navigationId) {
                this.currentState = history.state.navigationId;
            }
            // 登录界面为登出或初始化
            if (event.url.toLowerCase().includes('login')) {
                this.tabs = [];
                this.activeIndex = 0;
                return;
            }
            //    打开新的标签
            if (!this.tabs.find(tab => tab.url === event.url)) {
                const tab = new Tab();
                tab.id = event.id;
                tab.title = event.title;
                tab.translate = event.translate;
                tab.url = event.url;
                const activeIndex = this.tabs.push(tab) - 1;
                // 多个退出再进来会存在出现控制条的bug
                setTimeout(() => {
                    this.activeIndex = activeIndex;
                });
                this.fixPaginationStatus();
                // if (this.tabs.length === 1) {
                //     this.renderer2.removeClass(document.getElementById('routeTabs'), 'mat-tab-header-pagination-controls-enabled');
                // }
            } else { // 打开已有标签
                this.activeIndex = this.tabs.findIndex(tab => tab.url === event.url);
            }
            this.canDelete();
        });
    }

    /**
     * 关闭标签
     * @param index
     */
    closeTab(index) {
        // 删除的在选中之后
        const deleteKey = this.tabs[index].url;
        if (index > this.activeIndex) {
            this.tabs = this.tabs.filter((item, i) => i !== index);
            if (this.customReuseStrategy) {
                this.customReuseStrategy.routeHandles.delete(deleteKey);
            }
            this.canDelete();
            // 之前
        } else if (index < this.activeIndex) {
            this.tabs = this.tabs.filter((item, i) => i !== index);
            this.activeIndex = this.activeIndex - 1;
            if (this.customReuseStrategy) {
                this.customReuseStrategy.routeHandles.delete(deleteKey);
            }
            this.canDelete();
            // 删除的就是选中
        } else {
            this.tabs = this.tabs.filter((item, i) => i !== index);
            this.activeIndex = index - 1 > 0 ? index - 1 : this.tabs.length - 1;
            this.router.navigate([this.tabs[this.activeIndex].url]).then(() => {
                this.canDelete();
                if (this.customReuseStrategy) {
                    this.customReuseStrategy.routeHandles.delete(deleteKey);
                }
            });
        }
    }

    /**
     * 判断是否可以删除 剩余一个不让关闭标签
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
        sessionStorage.setItem('activeIndex', JSON.stringify(this.activeIndex));
    }

    ngOnInit() {
    }

}

export class Tab {
    id?: any;
    title: string;
    openMenu = false;
    translate?: string;
    url: string;
    canDelete = true;

    constructor() {
    }

}
