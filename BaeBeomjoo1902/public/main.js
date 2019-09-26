

window.onload = function () {

    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            tableContents.logined = true;

            var userId = firebase.auth().currentUser.uid;

            firebase.database().ref('todolist/' + userId).on('child_added', function (data) {

                var resultObject = {
                    name: data.val().name,
                    text: data.val().text,
                    state: data.val().state,
                    priority: data.val().priority,
                    date: data.val().date,
                    key: data.key,
                }
                app.todoList.push(resultObject);
            });

            firebase.database().ref('todolist/' + userId).on('child_changed', function (data) {
                console.log("child_changed: " + data.key);
                for(var i=0;i<app.todoList.length;i++){
                    if(app.todoList[i].key === data.key){
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


var tableContents = {

    logined: false,

    isButtonDisabled: false,
    isAddToDoMenu: false,

    states: ["TODO", "DOING", "DONE"],

    sendObject: {
        text: "",
        priority: "1",
        name: ""
    },

    todoList: [
    ]

}

var app = new Vue({
    el: '#app',
    data: tableContents,
    methods: {
        login: function () {
            var provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider);
        },
        logout: function () {
            firebase.auth().signOut();
        },
        clickAddTodo: function () {
            this.isAddToDoMenu = true;
        },
        backToTable: function () {
            this.isAddToDoMenu = false;
        },
        removeToDoList: function () {
            this.sendObject = {
                text: "",
                priority: "1",
                name: ""
            }
        },
        addToDoList: function () {

            this.isButtonDisabled = true;
            console.log(this.sendObject);
            var addToDoList = firebase.functions().httpsCallable('addToDoList');
            addToDoList(this.sendObject).then(function (result) {

                this.isButtonDisabled = false;
                this.backToTable();
                this.removeToDoList();
                console.log(result);

            }.bind(this)).catch(function (error) {

                var code = error.code;
                var message = error.message;
                var details = error.details;
                
                console.error('There was an error when calling the Cloud Function', error);
                window.alert('There was an error when calling the Cloud Function:\n\nError Code: '
                    + code + '\nError Message:' + message + '\nError Details:' + details);
                this.isButtonDisabled = false;
                this.backToTable();
                this.removeToDoList();

            }.bind(this));

        },
        moveToRight: function (key, state) {

            this.isButtonDisabled = true;
            var moveToRight = firebase.functions().httpsCallable('moveToRight');
            moveToRight({ key: key, state: state }).then(function (result) {

                console.log(result);
                this.isButtonDisabled = false;

            }.bind(this)).catch(function (error) {
                
                var code = error.code;
                var message = error.message;
                var details = error.details;
                
                console.error('There was an error when calling the Cloud Function', error);
                window.alert('There was an error when calling the Cloud Function:\n\nError Code: '
                    + code + '\nError Message:' + message + '\nError Details:' + details);
                this.isButtonDisabled = false;

            }.bind(this));
        },
    }
})