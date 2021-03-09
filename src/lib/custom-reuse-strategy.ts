import {ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy} from '@angular/router';
import {InjectionToken, Inject, Injectable, Optional} from '@angular/core';

export const EXCEPT_URLS = new InjectionToken('exceptUrls');

@Injectable()
export class CustomReuseStrategy extends RouteReuseStrategy {

    routeHandles: Map<string, DetachedRouteHandle> = new Map(); // 缓存路由快照  // routeCaches


    constructor(
        @Optional() @Inject(EXCEPT_URLS) public exceptUrls?: any[],
    ) {
        super();
        if (!this.exceptUrls) {
            this.exceptUrls = ['/login'];
        }
    }

    /**
     * 找回路由
     * get DetachedRoute by restUrl
     * @param route
     */
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
        return this.routeHandles.get(this.getRestUrl((route as any)._routerState.url));
    }

    /**
     * 是否可访问路由复用
     * Is routing multiplexing accessible
     * @param route
     */
    shouldAttach(route: ActivatedRouteSnapshot): boolean {
        return this.routeHandles.has(this.getRestUrl((route as any)._routerState.url)); // 有快照则放行
    }

    /**
     * 是否可脱离路由
     * can or not leave the route
     * @param route true 不会触发ngOnDesdroy false则会
     * return true  no ngOnDestroy triggered , false will
     */
    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        return !this.exceptUrls.includes((route as any)._routerState.url);
    }

    /**
     * 是否可复用路由
     * can or not reuse route
     * @param future
     * @param curr
     */
    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
        // 当前后两个路由路径存在父子级关系 并且返回父级时
        // When there is a parent-child relationship between the last two routing paths and the parent is returned
        if (future.url.length > 0 && curr.url.length > 0 && future.url[0].path === curr.url[0].path) {
            // goBack  store in sessionStorage
            if (sessionStorage.getItem('routeReload') && JSON.parse(sessionStorage.getItem('routeReload')).reload) {
                sessionStorage.removeItem('routeReload');
                this.routeHandles.delete(this.getRestUrl(curr['_routerState'].url));
            }
        }
        if ((curr as any)._routerState.url === '/login') {
            this.routeHandles.clear();
        }
        return future.routeConfig === curr.routeConfig;
    }

    /**
     * 储存路由快照
     * store route cache
     * @param route
     * @param handle
     */
    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
        if (handle && (!this.exceptUrls.includes((route as any)._routerState.url))) {
            this.routeHandles.set(this.getRestUrl((route as any)._routerState.url), handle);
        }
    }

    /**
     * 只保留restful api的url
     * remove the part after ?
     */
    getRestUrl(url) {
        return url.split('?')[0];
    }
}
