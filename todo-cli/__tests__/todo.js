/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const todoList = require("../todo");

const { all, add, markAsComplete } = todoList();
describe("First test suite ", () => {
  test("First case", () => {
    expect(true).toBe(true);
  });
  test("second case", () => {
    expect(-(2 - 4)).toBe(2);
  });
});
