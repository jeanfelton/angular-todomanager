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

  /**
   * Loading state variable
   * @type {true | false}
   */  
  loading : true | false = false;

  /**
   * Date format while submitting data
   * @type {string}
   */
  dateTimeFormat: string = 'YYYY-MM-DD HH:mm:ss';

  /**
   * Task list array sorted corresponding to priority
   * @type {TasksModel[]}
   */
  taskListArr: TasksModel[];
  taskListHighArr: TasksModel[];
  taskListMidArr: TasksModel[];
  taskListNormalArr: TasksModel[];

  /**
   * Filter value using due date of task
   * @type {string}
   */
  filterDueDate: string = '';

  /**
   * Filter value using priority of task 
   * @type {string}
   */
  filterPriority: string = '';

  /**
   * Search value using message key of task 
   * @type {string}
   */
  searchText: string = "";


  /**
   * @constructor
   * @param {NgbModal} modalService - Angular bootstrap modal service.
   * @param {TasksService} tasksService - Tasks CRUD api service.
   * @param {SnackbarService} snackBarService - Toast message service.
   */

  constructor(
    private modalService: NgbModal,
    private tasksService: TasksService,
    private snackBarService: SnackbarService
  ) {}

 

  ngOnInit(): void {
    this.initTaskData();
  }

   /**
   * Initialize component with tasks items and sort function  
   */

  initTaskData() {
    this.taskListArr = [];
    this.taskListHighArr = [];
    this.taskListMidArr = [];
    this.taskListNormalArr = [];
    this.loading = true;

    this.tasksService.getTasks().subscribe((res) => {      
      this.loading = false;
      if (res.status === 'success') {
        this.taskListArr = res.tasks;
        this.sortDataToPriority(res.tasks);
      } else {
        this.snackBarService.openSnackBar('Some error occured!!','Error');
      }
    });
  }

  /**
   * Sort tasks items based on priority
   * @param {array} taskDataArr : TaskItemsArray   
   */

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

  /**
   * Open modal component to  add / edit task
   * @param {object} editTaskObject : TaskItemsObject   
   */

  openModal(editTaskObject=null) {   

    const modalRef = this.modalService.open(AddTaskModalComponent);
    modalRef.componentInstance.taskData = editTaskObject;
    modalRef.result.then(
      (result) => {
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
        //console.log('modal close reason', reason);
      }
    );
  }

  /**
   * Delete function for task item
   * @param {string} id : task id to delete   
   */

  onDelete(id:string) {
    this.tasksService.deleteTask(id).subscribe((res) => {      
      if (res.status === 'success') {        
        this.snackBarService.openSnackBar('Successfully deleted','Success');
        this.removeTaskFromList(id);
      } else {
        this.snackBarService.openSnackBar('Some error occured!!','Error');
      }
    });
  }

  /**
   * Remove function for task item from DOM
   * @param {string} id : task id to delete   
   */
  removeTaskFromList(id:string) {

    const indexOfDeletedId =  this.taskListArr.findIndex((item)=>{
      return item.id === id
    })    
    const copyTaskArr = [
      ...this.taskListArr
    ];
    copyTaskArr.splice(indexOfDeletedId,1);
    this.taskListArr = copyTaskArr;
    this.sortDataToPriority(copyTaskArr);

  }

  /**
   * Add function for task item to DOM
   * @param {TasksModel} newItem : task object   
   */
  addNewTaskToList(newItem:TasksModel){
    this.taskListArr.push(newItem);
    this.sortDataToPriority(this.taskListArr);
  }

  /**
   * Update function for task item to DOM
   * @param {TasksModel} item : task object   
   */
  updateTaskToList(item:TasksModel){
    this.removeTaskFromList(item.id)
    this.taskListArr.push(item);
    this.sortDataToPriority(this.taskListArr);
  }
  
/**
   * Drag and Drop core function - Angular Material CDK
   * @param {CdkDragDrop} event : drag and drop object   
   */
  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {      
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      this.changeTaskPriority(event.item.data, event.container.id);
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  /**
   * Update function for task priority while drag and drop
   * @param {string} containerId : task priority of drag and drop container  
   * @param {TasksModel} taskObject : task object   
   */
  changeTaskPriority(taskObject: TasksModel, containerId: string) {
    this.tasksService
      .editTask({ ...taskObject, priority: containerId })
      .subscribe((res) => {        
        if (res.status === 'success') {
          this.snackBarService.openSnackBar('Updated Priority', 'Message');
        } else {
          this.snackBarService.openSnackBar('Some error occured!!', 'Error');
        }
      });
  }

  /**
   * Filter base function    
   */
  filterData() {
    this.searchText = "";       

    if (this.filterPriority !== '' || this.filterDueDate !== '') {
      
      const filteredDataArr = this.filterArrayOnDueDatePriority()
      this.sortDataToPriority(filteredDataArr);
    }
    if (this.filterPriority === '' && this.filterDueDate === '') {
      this.sortDataToPriority(this.taskListArr);
    }
  }

  /**
   * Filter sub function - detailed logic   
   */
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

  /**
   * Search function based on search keyword entered for message   
   */
  searchClick() {    
    const searchArray =  this.taskListArr.filter((item)=>{      
      const messageText =  item.message.toLowerCase();
      const searchText =  this.searchText.toLowerCase();
    
       return messageText.includes(searchText) 
      
    })
    this.sortDataToPriority(searchArray);
  }



}
