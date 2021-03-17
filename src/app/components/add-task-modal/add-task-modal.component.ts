import { UsersModel } from './../../models/users.model';
import { TasksService } from './../../core/http/tasks.service';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';


@Component({
  selector: 'app-add-task-modal',
  templateUrl: './add-task-modal.component.html',
  styleUrls: ['./add-task-modal.component.scss'],
})
export class AddTaskModalComponent implements OnInit {
  @Input() taskData;

  /**
   * User list
   * @type {array}
   */
  userList: UsersModel[];

  /**
   * Date format while submitting data
   * @type {string}
   */
  dateTimeFormat: string = 'YYYY-MM-DD HH:mm:ss';
  dateTimeFormatToFormInput: string= 'YYYY-MM-DDTHH:mm';

  /**
   * task id for edit case
   * @type {string}
   */
  taskId : string = "";

  /**
   * Add / Edit form validation message
   * @type {string}
   */
  errorMsg: string = ""; 

  /**
   * Add / Edit title text
   * @type {string}
   */
  titleText: string = "Add Task";

  /**
   * Formbuilder  
   */
  taskForm = this.fb.group({    
    message: ['', Validators.required],
    due_date: [''],
    priority: ['', Validators.required],
    assigned_to: [''],
  });

  /**
   * @constructor
   * @param {NgbActiveModal} activeModal - Angular bootstrap modal service.
   * @param {TasksService} tasksService - Tasks CRUD api service.
   * @param {FormBuilder} fb - Form builder service.
   */
  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private taskService: TasksService,    
  ) {
    this.initUserArr();
  } 
 

  ngOnInit(): void {
    this.initializeForm();    
  }


  /**
   * Initialize user list array 
   */
   initUserArr() {
    this.taskService.getUsers().subscribe((res) => {      
      if (res.status === 'success') {
        this.userList = res.users;
      }
    });
  }

  /**
   * Initialize form with task data in edit case
   */
  initializeForm() {

    if(this.taskData) {
      
      const inputDate = moment(this.taskData.due_date).format(this.dateTimeFormatToFormInput);
      
      this.titleText = "Edit Task";
      this.taskId = this.taskData.id
      const formData = {
        message: this.taskData.message,
        due_date:inputDate ,
        priority: this.taskData.priority,
        assigned_to: this.taskData.assigned_to,
      }
      this.taskForm.setValue(formData);
    }
    
  }

  /**
   * Form submit function with vaildation check and Add / Edit API call
   */
  onFormSubmit() {

    if (!this.taskForm.valid) {
      this.errorMsg = 'Fill mandatory fields';      
    }

    if (this.taskForm.valid) {
      this.errorMsg = '';
      if(this.taskId !== "") {
        this.editApiCall(this.taskId);
      } else {
        this.addApiCall();    
      }       
    }

  }
  
  /**
   *  Add task data API call
   */
  addApiCall() {

    const transDateFormat = this.transformDate(this.taskForm.value.due_date);
    const userName = this.findUserName(this.taskForm.value.assigned_to);

    this.taskService
        .addTask({
          ...this.taskForm.value,
          due_date: transDateFormat,
        })
        .subscribe((res) => {          
          if (res.status === 'success') {            
            const editedTaskItem = {
              ...this.taskForm.value,
              due_date: transDateFormat,
              assigned_name:userName,
              id:res.taskid
            };
            const resultObject = {
              action:"add",
              value:editedTaskItem
            }
            this.activeModal.close(resultObject);
          } else {
            this.errorMsg = 'Some error occured!!';  
          }
        });

  }

  /**
   *  Edit task data API call
   */
  editApiCall(id:string) {

    const transDateFormat = this.transformDate(this.taskForm.value.due_date);
    const userName = this.findUserName(this.taskForm.value.assigned_to);

    this.taskService
        .editTask({
          ...this.taskForm.value,
          due_date: transDateFormat,
          id:id
        })
        .subscribe((res) => {          
          if (res.status === 'success') {            
            const editedTaskItem = {
              ...this.taskForm.value,
              due_date: transDateFormat,
              assigned_name:userName,
              id:res.taskid             
            };
            const resultObject = {
              action:"edit",
              value:editedTaskItem
            }
            this.activeModal.close(resultObject);
          } else {                       
              this.errorMsg = 'Some error occured';
          }
        });

  }  

  /**
   * Transform date time to 'YYYY-MM-DD HH:mm:ss' format
   * @param dateValue 
   * 
   */
  transformDate(dateValue){
    return moment(dateValue).format(this.dateTimeFormat);
  }

  /**
   * Gets username from user id
   * @param {string} id : user id
   * @returns {string} user name
   */

  findUserName(id){
    const user = this.userList.find((item)=>{
      return item.id === id
    });

    return user !== undefined ?  user.name : "";
  }

}
