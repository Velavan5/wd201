/* eslint-disable no-unused-vars */
"use strict";
const { Model , Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    //functions to retrieve values from database
    static  getTodos(){
      return  this.findAll();
    }
    static async overdue() {
      // FILL IN HERE TO RETURN OVERDUE ITEMS
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return await Todo.findAll({
        where:{
        dueDate:{
          [Op.lt]:today
        }
      },
      order: [['id', 'ASC']]
    });
    }
    static async dueToday() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return await Todo.findAll({
        where:{
          dueDate:{
            [Op.eq]:today
          }
        },
        order: [['id', 'ASC']]
      });
    }
    static async dueLater() {
      // FILL IN HERE TO RETURN ITEMS DUE LATER
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return await Todo.findAll({
        where:{
          dueDate:{
            [Op.gt]:today
          }
        },
      order: [['id', 'ASC']]
      });
    }


    //end of retrieve functions
    static addTodo({ title, dueDate }) {
      return this.create({ title , dueDate , completed: false });
    }

    markAsCompleted() {
      return this.update({ completed: true });
    }

    setCompletionStatus(value){//value - boolean
      if (value)  return this.update({completed: true});
      else  return this.update({completed: false});
    }

    static async remove(id){
      return this.destroy({
        where :{
          id
        }
      });
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
      modelName: "Todo",
    }
  );
  return Todo;
};
