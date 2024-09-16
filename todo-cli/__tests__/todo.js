/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const todoList = require("../todo");

const { all, add, markAsComplete, overdue, dueToday, dueLater } = todoList();
describe("Tests for Todolist ", () => {
  beforeEach(() => {
    // Reset the todos array before each test
    all.length = 0;
  });

  test("Creates New todo", () => {
    add({
      title: "Service Vehicle",
      dueDate: new Date().toISOString().slice(0, 10),
      completed: false,
    });
    expect(all.length).toBe(1);
    expect(all[0].title).toBe("Service Vehicle");
  });

  test("todo Mark as Complete", () => {
    add({
      title: "Service Vehicle",
      dueDate: new Date().toISOString().slice(0, 10),
      completed: false,
    });
    expect(all[0].completed).toBe(false);
    markAsComplete(0);
    expect(all[0].completed).toBe(true);
  });

  test("should retrieve overdue todos", () => {
    add({
      title: "Buy groceries",
      dueDate: "2024-08-08",
      completed: false,
    }); // Assuming today's date is 2024-09-16

    const over = overdue();
    expect(over.length).toBe(1);
    expect(over[0].title).toBe("Buy groceries");
  });

  test("should retrieve todos due today", () => {
    add({
      title: "Buy groceries",
      dueDate: new Date().toISOString().slice(0, 10),
      completed: false,
    });

    const dueTodayTodos = dueToday();
    expect(dueTodayTodos.length).toBe(1);
    expect(dueTodayTodos[0].title).toBe("Buy groceries");
  });

  test("should retrieve todos due later", () => {
    add({
      title: "Prepare meeting",
      dueDate: "2025-02-02",
      completed: false,
    });

    const dueLaterTodos = dueLater();
    expect(dueLaterTodos.length).toBe(1);
    expect(dueLaterTodos[0].title).toBe("Prepare meeting");
  });
});
