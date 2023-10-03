import { CommonModule, NgIf } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Subject, takeUntil } from 'rxjs';

import { FileReaderService } from './file-reader.service';
import { Operation } from './shared/enum/operation';

export interface IList {
  id: number;
  name: string;
  qtd: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    MatTableModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
  ],
})
export class AppComponent implements OnDestroy {
  title = 'Lista de Compras';

  dataSource: Array<any> = [];
  dataSourceBase: Array<any> = [];
  displayedColumns: string[] = ['id', 'name', 'qtd', 'actions'];
  operation: Operation;

  form: FormGroup;
  formFilter: FormGroup;
  indexEdit: number;

  destroy$ = new Subject<void>();

  constructor(private _fileReaderService: FileReaderService) {
    this.formFilter = new FormGroup({ filter: new FormControl(null) });
    this.operation = Operation.INDEX;
    this.listenFilterChanges();
    this.createForm();
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

  listenFilterChanges(): void {
    this.formFilter
      .get('filter')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((search: string) =>
        this.onSearch(search, this.dataSourceBase)
      );
  }

  createForm(): void {
    this.form = new FormGroup({
      id: new FormControl({ value: null, disabled: true }),
      name: new FormControl(null, [
        Validators.required,
        Validators.maxLength(100),
      ]),
      qtd: new FormControl(null, [Validators.required, Validators.min(1)]),
    });
  }

  onAdd(): void {
    this.operation = Operation.NEW;
    this.title = 'Adicionando';
  }

  onClickRow(data: IList): void {
    this.operation = Operation.VIEW;
    this.form.disable();
    this.title = 'Editando #' + data.id;
    const index = this.dataSourceBase.findIndex(
      (list: IList) => JSON.stringify(list) === JSON.stringify(data)
    );
    this.indexEdit = index;
    this.form.patchValue(data);
  }

  onEdit(): void {
    this.operation = Operation.EDIT;
    this.form.enable();
    this.form.get('id')?.disable();
  }

  onDelete(data: IList): void {
    this.dataSource = this.dataSourceBase.filter(
      (list: IList) => JSON.stringify(list) !== JSON.stringify(data)
    );
    this.dataSourceBase = this.dataSource;
    alert('Excluído com sucesso!');
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

  onSave(): void {
    if (this.operation === Operation.NEW) {
      this.dataSource = [
        { ...this.form.getRawValue(), id: this.dataSourceBase.length + 1 },
        ...this.dataSourceBase,
      ];
      alert('Incluído com sucesso!');
    } else {
      this.dataSourceBase[this.indexEdit] = {
        id: this.dataSourceBase.length + 1,
        ...this.form.getRawValue(),
      };
      this.dataSourceBase = [...this.dataSourceBase];
      alert('Editado com sucesso!');
    }
    this.dataSourceBase = this.dataSource;
    this.onBack();
  }

  onBack(): void {
    this.operation = Operation.INDEX;
    this.indexEdit = null;
    this.createForm();
    this.title = 'Lista de Compras';
  }
}
