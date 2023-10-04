import { AUTO_STYLE } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { FileReaderService } from 'src/app/file-reader.service';
import { DrawerComponent } from 'src/app/shared/components/drawer/drawer.component';
import { ExcludeDialogComponent } from 'src/app/shared/components/exclude-dialog/exclude-dialog.component';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { TableComponent } from 'src/app/shared/components/table/table.component';
import { Operation } from 'src/app/shared/enums/operation';
import { IList } from 'src/app/shared/interfaces/list.interface';

import { FormShoppingListComponent } from './form-shopping-list/form-shopping-list.component';

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss'],
  imports: [
    CommonModule,
    DrawerComponent,
    TableComponent,
    HeaderComponent,
    FormShoppingListComponent,
    ExcludeDialogComponent,
  ],
})
export class ShoppingListComponent implements OnDestroy {
  title: string = 'Lista de Compras';

  operation: Operation;
  openedDrawer: boolean;

  listEdit: IList;
  formFilter: FormGroup;

  dataSource: Array<any> = [];
  dataSourceBase: Array<any> = [];
  displayedColumns: string[] = ['id', 'name', 'qtd', 'actions'];

  destroy$ = new Subject<void>();

  constructor(
    private _dialog: MatDialog,
    private _toastr: ToastrService,
    private _fileReaderService: FileReaderService
  ) {
    this.operation = Operation.INDEX;
    this.getDataList();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getDataList(): void {
    this._fileReaderService
      .readTxtFile()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const arData = data.split('\r\n');
        this.dataSource = arData.map((list: any) => ({
          id: Number(list.split(';')[0] || 0),
          name: list.split(';')[1],
          qtd: Number(list.split(';')[2] || 0),
        }));
        this.dataSourceBase = this.dataSource;
      });
  }

  onAdd(): void {
    this.operation = Operation.NEW;
    this.openedDrawer = true;
  }

  onClickRow(data: IList): void {
    this.operation = Operation.VIEW;
    this.openedDrawer = true;
    this.listEdit = data;
  }

  onDeleteItem(data: IList): void {
    this._dialog
      .open(ExcludeDialogComponent, {
        maxHeight: '80vh',
        height: AUTO_STYLE,
        data: {},
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (e) => {
        if (e?.confirm) {
          this.dataSource = this.dataSourceBase.filter(
            (list: IList) => JSON.stringify(list) !== JSON.stringify(data)
          );
          this.dataSourceBase = this.dataSource;
          this._toastr.success('Excluído com sucesso!');
        }
      });
  }

  onSearch(searchText: string, dataSourceBase: Array<any>): void {
    if (!dataSourceBase.length) {
      return;
    }
    searchText = searchText ? searchText.toString().toLocaleLowerCase() : '';

    this.dataSource = dataSourceBase.filter((obj) => {
      const has = Object.values(obj).filter((element) => {
        if (
          element !== null &&
          element.toString().toLocaleLowerCase().indexOf(searchText) > -1
        ) {
          return element;
        }
        return false;
      });
      return has.length ? true : false;
    });
  }

  onSave(payload: IList): void {
    if (this.operation === Operation.NEW) {
      const invalid = this.validateProduct(payload);
      if (invalid) {
        return;
      }
      this.dataSource = [
        { ...payload, id: this.dataSourceBase.length + 1 },
        ...this.dataSourceBase,
      ];
      this._toastr.success('Incluído com sucesso!');
    } else {
      const index = this.dataSourceBase.findIndex(
        (list: IList) => JSON.stringify(list) === JSON.stringify(this.listEdit)
      );
      const invalid = this.validateProduct(payload, index);
      if (invalid) {
        return;
      }

      this.dataSourceBase[index] = {
        id: this.dataSourceBase.length + 1,
        ...payload,
      };
      this.dataSourceBase = [...this.dataSourceBase];
      this._toastr.success(
        `${this.listEdit.name} editada para ${payload.name}`
      );
    }
    this.dataSource = [...this.dataSource];
    this.dataSourceBase = this.dataSource;
    this.onCloseDrawer();
  }

  validateProduct(payload: IList, index = -1): boolean {
    const indexInvalid = this.dataSourceBase.findIndex(
      (element) => element.name?.toUpperCase() === payload.name?.toUpperCase()
    );
    if (indexInvalid > -1 && indexInvalid !== index) {
      this._toastr.error('Produto já existente!');
      return true;
    }
    return false;
  }

  onCloseDrawer(): void {
    this.openedDrawer = false;
    this.operation = Operation.INDEX;
    this.listEdit = null;
  }
}
