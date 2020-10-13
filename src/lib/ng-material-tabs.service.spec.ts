import { TestBed } from '@angular/core/testing';

import { NgMaterialTabsService } from './ng-material-tabs.service';

describe('NgMaterialTabsService', () => {
  let service: NgMaterialTabsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgMaterialTabsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
