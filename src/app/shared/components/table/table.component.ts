import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  standalone: true,
  imports: [MatTableModule, MatIconModule],
})
export class TableComponent {
  @Input({ required: true }) dataSource: Array<any> = [];
  @Input({ required: true }) displayedColumns: string[];

  @Output() clickRow = new EventEmitter();
  @Output() deleteItem = new EventEmitter();

  onClickRow(row: any): void {
    this.clickRow.emit(row);
  }

  onDeleteItem(event): void {
    this.deleteItem.emit(event);
  }
}
