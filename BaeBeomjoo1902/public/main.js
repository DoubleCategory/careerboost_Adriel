window.onload = () => {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      tableContents.logined = true;

      const userId = firebase.auth().currentUser.uid;

      firebase
        .database()
        .ref("todolist/" + userId)
        .on("child_added", data => {
          const resultObject = {
            name: data.val().name,
            text: data.val().text,
            state: data.val().state,
            priority: data.val().priority,
            date: data.val().date,
            key: data.key
          };
          app.todoList.push(resultObject);
        });

      firebase
        .database()
        .ref("todolist/" + userId)
        .on("child_changed", data => {
          for (let i = 0; i < app.todoList.length; i++) {
            if (app.todoList[i].key === data.key) {
              app.todoList[i].state = data.val().state;
              break;
            }
          }
        });
    } else {
      tableContents.logined = false;
      app.todoList = [];
    }
  });
};

const tableContents = {
  logined: false,

  isButtonDisabled: false,
  isAddToDoMenu: false,

  states: ["TODO", "DOING", "DONE"],

  sendObject: {
    text: "",
    priority: "1",
    name: ""
  },

  todoList: []
};

const app = new Vue({
  el: "#app",
  data: tableContents,
  methods: {
    login() {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider);
    },
    logout() {
      firebase.auth().signOut();
    },
    clickAddTodo() {
      this.isAddToDoMenu = true;
    },
    backToTable() {
      this.isAddToDoMenu = false;
    },
    removeToDoList() {
      this.sendObject = {
        text: "",
        priority: "1",
        name: ""
      };
    },
    addToDoList() {
      this.isButtonDisabled = true;

      const addToDoList = firebase.functions().httpsCallable("addToDoList");
      addToDoList(this.sendObject)
        .then(result => {
          this.isButtonDisabled = false;
          this.backToTable();
          this.removeToDoList();
        })
        .catch(error => {
          const { code, message, details } = error;

          console.error(
            "There was an error when calling the Cloud Function",
            error
          );
          window.alert(
            "There was an error when calling the Cloud Function:\n\nError Code: " +
              code +
              "\nError Message:" +
              message +
              "\nError Details:" +
              details
          );
          this.isButtonDisabled = false;
          this.backToTable();
          this.removeToDoList();
        });
    },
    moveToRight(key, state) {
      this.isButtonDisabled = true;
      const moveToRight = firebase.functions().httpsCallable("moveToRight");
      moveToRight({ key: key, state: state })
        .then(result => {
          this.isButtonDisabled = false;
        })
        .catch(error => {
          const { code, message, details } = error;

          console.error(
            "There was an error when calling the Cloud Function",
            error
          );
          window.alert(
            "There was an error when calling the Cloud Function:\n\nError Code: " +
              code +
              "\nError Message:" +
              message +
              "\nError Details:" +
              details
          );
          this.isButtonDisabled = false;
        });
    }
  }
});
