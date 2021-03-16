import { TasksService } from './../../core/http/tasks.service';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormArray, Validators } from '@angular/forms';
import { NgbActiveModal, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { SnackbarService } from 'src/app/core/snackbar/snackbar.service';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import * as moment from 'moment';

@Component({
  selector: 'app-add-task-modal',
  templateUrl: './add-task-modal.component.html',
  styleUrls: ['./add-task-modal.component.scss'],
})
export class AddTaskModalComponent implements OnInit {
  @Input() taskData;

  modelDate: NgbDateStruct;
  userList: any[];
  dateTimeFormat = 'YYYY-MM-DD HH:mm:ss';
  taskId = "";  

  taskForm = this.fb.group({    
    message: ['', Validators.required],
    due_date: [''],
    priority: ['', Validators.required],
    assigned_to: [''],
  });

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private taskService: TasksService,
    private snackBarService: SnackbarService
  ) {
    this.taskService.getUsers().subscribe((res) => {
      console.log('Users', res);
      if (res.status === 'success') {
        this.userList = res.users;
      }
    });
  }

 

  ngOnInit(): void {
    console.log('edit task data', this.taskData);
    
    this.initializeForm();    
  }

  initializeForm() {

    if(this.taskData) {
      console.log('edit mode')
      this.taskId = this.taskData.id
      const formData = {
        message: this.taskData.message,
        due_date: this.taskData.due_date,
        priority: this.taskData.priority,
        assigned_to: this.taskData.assigned_to,
      }
      this.taskForm.setValue(formData);
    }
    
  }

  onFormSubmit() {

    console.log('onFormSubmit');
    console.log('this.taskForm.value', this.taskForm.value);

    if (!this.taskForm.valid) {
      this.snackBarService.openSnackBar('Fill mandatory fields', 'Error');
    }

    if (this.taskForm.valid) {

      if(this.taskId !== "") {
        this.editApiCall(this.taskId);
      } else {
        this.addApiCall();    
      }

       
    }
  }

  addApiCall() {

    const transDateFormat = this.transformDate(this.taskForm.value.due_date);
    const userName = this.findUserName(this.taskForm.value.assigned_to);

    console.log('user find',userName)

    this.taskService
        .addTask({
          ...this.taskForm.value,
          due_date: transDateFormat,
        })
        .subscribe((res) => {
          console.log('res addTask', res);
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
          }
        });

  }

  editApiCall(id) {

    const transDateFormat = this.transformDate(this.taskForm.value.due_date);
    const userName = this.findUserName(this.taskForm.value.assigned_to);

    this.taskService
        .editTask({
          ...this.taskForm.value,
          due_date: transDateFormat,
          id:id
        })
        .subscribe((res) => {
          console.log('res editTask', res);
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
          }
        });

  }

  

  transformDate(dateValue){
    return moment(dateValue).format(this.dateTimeFormat);
  }

  findUserName(id){
    const user = this.userList.find((item)=>{
      return item.id === id
    });

    return user !== undefined ?  user.name : "";
  }

}
