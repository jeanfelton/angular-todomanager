export interface TasksModel {
    message: string;   
    due_date?: string | null;
    priority?: string | null;
    assigned_to?:string | null;   
    assigned_name?:string | null;  
    id?: string | null; 
  }