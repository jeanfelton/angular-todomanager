import { TasksModel } from './../../models/tasks.model';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment'


@Injectable({
  providedIn: 'root',
})
export class TasksService {

  private endPoint = environment.APIENDPOINT;
  private headers = new HttpHeaders();

  createAuthorizationHeader() {    
    return this.headers.append('AuthToken', environment.APIKEY);    
  }

  constructor(private _http: HttpClient) {}

  addTask(data: TasksModel) {
    let headersConfig = this.createAuthorizationHeader();
    const formData = new FormData();
    formData.append('message',data.message)
    formData.append('priority',data.priority)
    formData.append('assigned_to',data.assigned_to)
    formData.append('due_date',data.due_date)
    return this._http.post<any>(this.endPoint + '/create', formData, {
      headers: headersConfig,
    });
  }

  editTask(data: TasksModel) {
    let headersConfig = this.createAuthorizationHeader();
    const formData = new FormData();
    formData.append('taskid',data.id)
    formData.append('message',data.message)
    formData.append('priority',data.priority)
    formData.append('assigned_to',data.assigned_to)
    formData.append('due_date',data.due_date)
    return this._http.post<any>(this.endPoint + '/update', formData, {
      headers: headersConfig,
    });
  }

  getTasks() : Observable<any>{
    let headersConfig = this.createAuthorizationHeader();    
    return this._http.get<any>(this.endPoint + '/list', {
      headers: headersConfig,
    });
  }

  getUsers() : Observable<any>{
    let headersConfig = this.createAuthorizationHeader();    
    return this._http.get<any>(this.endPoint + '/listusers', {
      headers: headersConfig,
    });
  }

  deleteTask(id){
    let headersConfig = this.createAuthorizationHeader();
    const formData = new FormData();
    formData.append('taskid',id)
    return this._http.post<any>(this.endPoint + '/delete', formData, {
      headers: headersConfig,
    });
  }

}
