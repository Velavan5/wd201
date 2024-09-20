// models/todo.js
'use strict';
const { Model, Op } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static async addTask(params) {
      return await Todo.create(params);
    }

    static async showList() {
      console.log('My Todo list \n');
    
      console.log('Overdue');
      const overdueTasks = await Todo.overdue();
      overdueTasks.forEach((task) => console.log(task.displayableString()));
      console.log('\n');
    
      console.log('Due Today');
      const todayTasks = await Todo.dueToday();
      todayTasks.forEach((task) => console.log(task.displayableString()));
      console.log('\n');
    
      console.log('Due Later');
      const laterTasks = await Todo.dueLater();
      laterTasks.forEach((task) => console.log(task.displayableString()));
    }
    

    static async overdue() {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      const today = new Date();
      return await Todo.findAll({
        where:{
        dueDate:{
          [Op.lt]:today
        }
      }});
    }

    static async dueToday() {
      const today = new Date();
      return await Todo.findAll({
        where:{
          dueDate:{
            [Op.eq]:today
          }
        }
      });
      // FILL IN HERE TO RETURN ITEMS DUE tODAY
    }

    static async dueLater() {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      const today = new Date();
      return await Todo.findAll({
        where:{
          dueDate:{
            [Op.gt]:today
          }
        }
      });
    }

    static async markAsComplete(id) {
      // FILL IN HERE TO MARK AN ITEM AS COMPLETE
     let task = await Todo.findByPk(id);
     if (task){
      task.completed = true;
      await task.save();
     }
    }

    displayableString() {
      let checkbox = this.completed ? '[x]' : '[ ]';
      const today = new Date().toISOString().split('T')[0];
      return (this.dueDate === today)? `${this.id}. ${checkbox} ${this.title}` : `${this.id}. ${checkbox} ${this.title} ${this.dueDate}`;
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: 'Todo',
    },
  );
  return Todo;
};
