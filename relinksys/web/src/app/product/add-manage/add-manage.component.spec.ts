import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddManageComponent } from './add-manage.component';

describe('AddManageComponent', () => {
  let component: AddManageComponent;
  let fixture: ComponentFixture<AddManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddManageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
