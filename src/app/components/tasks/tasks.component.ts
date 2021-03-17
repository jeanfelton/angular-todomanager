import { TasksModel } from './../../models/tasks.model';
import { TasksService } from './../../core/http/tasks.service';
import { AddTaskModalComponent } from './../add-task-modal/add-task-modal.component';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SnackbarService } from 'src/app/core/snackbar/snackbar.service';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,  
} from '@angular/cdk/drag-drop';
import * as moment from 'moment';


@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss'],
})

/**
 * Class representing a list of task and to manage features like serach, filter etc.
 */
export class TasksComponent implements OnInit {

    
  loading = false;
  dateTimeFormat = 'YYYY-MM-DD HH:mm:ss';

  taskListArr: TasksModel[];
  taskListHighArr: TasksModel[];
  taskListMidArr: TasksModel[];
  taskListNormalArr: TasksModel[];

  filterDueDate: string = '';
  filterPriority: string = '';
  searchText: string = "";

  constructor(
    private modalService: NgbModal,
    private tasksService: TasksService,
    private snackBarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.initTaskData();
  }

  initTaskData() {
    this.taskListArr = [];
    this.taskListHighArr = [];
    this.taskListMidArr = [];
    this.taskListNormalArr = [];
    this.loading = true;

    this.tasksService.getTasks().subscribe((res) => {
      console.log('getTasks res', res);
      this.loading = false;
      if (res.status === 'success') {
        this.taskListArr = res.tasks;
        this.sortDataToPriority(res.tasks);
      }
    });
  }

  sortDataToPriority(taskDataArr = []) {
    this.taskListNormalArr = [];
    this.taskListMidArr = [];
    this.taskListHighArr = [];

    taskDataArr.map((item) => {
      const transData = {
        ...item,
        assigned_name: item.assigned_to == false ? '' : item.assigned_name,
      };

      if (item.priority == 1) this.taskListNormalArr.push(transData);
      if (item.priority == 2) this.taskListMidArr.push(transData);
      if (item.priority == 3) this.taskListHighArr.push(transData);
    });
  }

  openModal(editTaskObject="") {   

    const modalRef = this.modalService.open(AddTaskModalComponent);
    modalRef.componentInstance.taskData = editTaskObject;
    modalRef.result.then(
      (result) => {        
        console.log('modal close result', result);
        if(result.action === "add") {
          this.snackBarService.openSnackBar('Successfully added','Success');
          this.addNewTaskToList(result.value);
        } 
        if(result.action === "edit") {
          this.snackBarService.openSnackBar('Successfully edited','Success');
          this.updateTaskToList(result.value);
        }       
       
      },
      (reason) => {        
        console.log('modal close reason', reason);
      }
    );
  }

  onDelete(id) {
    console.log('OnDelete ID', id);
    console.log(typeof id);    
    
    this.tasksService.deleteTask(id).subscribe((res) => {
      console.log('deleteTask res', res);
      if (res.status === 'success') {
        console.log('Delete success');
        this.snackBarService.openSnackBar('Successfully deleted','Success');
        this.removeTaskFromList(id);
      }
    });
  }

  removeTaskFromList(id) {

    const indexOfDeletedId =  this.taskListArr.findIndex((item)=>{
      return item.id === id
    })
    console.log('indexOfDeletedId',indexOfDeletedId);
    const copyTaskArr = [
      ...this.taskListArr
    ];
    copyTaskArr.splice(indexOfDeletedId,1);
    this.taskListArr = copyTaskArr;
    this.sortDataToPriority(copyTaskArr);

  }

  addNewTaskToList(newItem){
    this.taskListArr.push(newItem);
    this.sortDataToPriority(this.taskListArr);
  }

  updateTaskToList(item){
    this.removeTaskFromList(item.id)
    this.taskListArr.push(item);
    this.sortDataToPriority(this.taskListArr);
  }
  

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      console.log('moveItemInArray', event.item.data);
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      console.log('transferArrayItem', event.item.data);
      console.log('transferArrayItem container.id', event.container.id);

      this.changeTaskPriority(event.item.data, event.container.id);

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  changeTaskPriority(taskObject: TasksModel, containerId: string) {
    this.tasksService
      .editTask({ ...taskObject, priority: containerId })
      .subscribe((res) => {
        console.log('res', res);
        if (res.status === 'success') {
          this.snackBarService.openSnackBar('Updated Priority', 'Message');
        }
      });
  }

  filterData() {
      
    console.log(this.taskListArr);   
    console.log('filterPriority',this.filterPriority); 
    console.log('filterDueDate',this.filterDueDate);
    this.searchText = "";       

    if (this.filterPriority !== '' || this.filterDueDate !== '') {
      
      const filteredDataArr = this.filterArrayOnDueDatePriority()
      this.sortDataToPriority(filteredDataArr);
    }
    if (this.filterPriority === '' && this.filterDueDate === '') {
      this.sortDataToPriority(this.taskListArr);
    }
  }

  filterArrayOnDueDatePriority () {

    const filteredArr = []

    const transDateFormat = moment(this.filterDueDate).format(
      this.dateTimeFormat
    );

    this.taskListArr.map((item) => {

      if (
        (this.filterPriority !== '' &&
        this.filterDueDate === '') &&
        this.filterPriority === item.priority
      ) {
        filteredArr.push(item);
      }

      if (
        (this.filterPriority === '' &&
        this.filterDueDate !== '') &&
        transDateFormat === item.due_date
      ) {        
        filteredArr.push(item);
      }

      if (
        (this.filterPriority !== '' &&
        this.filterDueDate !== '') &&
        (transDateFormat === item.due_date &&
        this.filterPriority === item.priority)
      ) {
        filteredArr.push(item);
      }      
        
    });


    return filteredArr;

  }

  searchClick() {
    console.log('searchText',this.searchText)
    const searchArray =  this.taskListArr.filter((item)=>{
      console.log(item)
      console.log(item.message.search(this.searchText))
      const messageText =  item.message.toLowerCase();
      const searchText =  this.searchText.toLowerCase();
    
       return messageText.includes(searchText) 
      
    })

    console.log('searchArray',searchArray)
    this.sortDataToPriority(searchArray);
  }



}
