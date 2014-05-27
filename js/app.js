(function(){
  Parse.initialize('peB5zMAjhJILv4i6pMuDCCYdiP2PRUYNVQpt0Sw6',
    'zhDXAvV9CJFDP5yDpfjhWBw0d1hpNBALpsbkiVMp');
  var templates = {};
  ['loginView', 'evaluationView', 'updateSuccessView'].forEach(function(e){
      var dom = document.getElementById(e);
      templates[e] = doT.template(dom.text);
  });
  //可選-編寫共用函數();
  var handler = {
    navbar: function(){
      var currentUser = Parse.User.current();
      if(currentUser){
        //已登入
        $('#loginButton').css('display','none');
        $('#evaluationButton').css('display','');
        $('#logoutButton').css('display','');
        $('#logoutButton').click(function(){
              Parse.User.logOut();
              handler.navbar();
              window.location.hash = 'login/';
            });
      } else {
        //未登入
        $('#loginButton').css('display','');
        $('#evaluationButton').css('display','none');
        $('#logoutButton').css('display','none');
      }
    },
    login: function(){
      //把版型印到瀏覽器上();
      $('#content').html(templates.loginView());
      //綁定登入表單的學號檢查事件(); // 可以利用TAHelp物件
      $('#form-signin-student-id').bind('keyup', function(){
        var message = "The student is not one of the class students."
        if (!TAHelp.isVaildStudentID($('#form-signin-student-id').val())){
          $('#form-signin-message').css('display','');
          $('#form-signin-message').html(message);
        }
        else{
          $('#form-signin-message').css('display','none');
          $('#form-signin-message').html('');
        }
      });
      //綁定註冊表單的學號檢查事件(); // 可以利用TAHelp物件
      $('#form-signup-student-id').bind('keyup', function(){
        var message = "The student is not one of the class students."
        if (!TAHelp.isVaildStudentID($('#form-signup-student-id').val())){
          $('#form-signup-message').css('display','');
          $('#form-signup-message').html(message);
        }
        else{
          $('#form-signup-message').css('display','none');
          $('#form-signup-message').html('');
        }   
      });
      //綁定註冊表單的密碼檢查事件(); // 參考上課範例
      $('#form-signup-password1').bind('keyup', function(){
        var singupForm_password = $('#form-signup-password');
        if ($(this).val() !== singupForm_password.val()){
          $('#form-signup-message').html('密碼不一致，請再確認一次。');
          $('#form-signup-message').css('display','');
        }
        else{
          $('#form-signup-message').html('');
          $('#form-signup-message').css('display','none');
        }
      });
      //綁定登入表單的登入檢查事件(); // 送出還要再檢查一次，這裡會用Parse.User.logIn
      $('#form-signin').bind('submit', function(){
        if(TAHelp.isVaildStudentID($('#form-signin-student-id').val())){
          Parse.User.logIn($('#form-signin-student-id').val(),
              $('#form-signin-password').val(), {
            success: function(user) {
              handler.navbar();
              window.location.hash = 'peer-evaluation/';
            },
            error: function(user, error) {
              handler.navbar();
              window.location.hash = 'login/';
            }
          });
        }
        else{
          $('#form-signup-message').html("The student is not one of the class students or the password is not correct.");
          $('#form-signin-message').css('display','');
        }
      });
      //綁定註冊表單的註冊檢查事件(); // 送出還要再檢查一次，這裡會用Parse.User.signUp和相關函數
      $('#form-signup').bind('submit', function(){
            if(TAHelp.isVaildStudentID($('#form-signup-student-id').val())){
              var user = new Parse.User();
              user.set("username", $('#form-signup-student-id').val());
              user.set("password", $('#form-signup-password').val());
              user.set("email", $('#form-signup-email').val());
     
              user.signUp(null, {
                  success: function(user) {
                    handler.navbar();
                    window.location.hash = '';
                  },
                  error: function(user, error) {
                    // Show the error message somewhere and let the user try again.
                    $('#form-signup-message').html(error.message + '['+error.code+']');
                    $('#form-signup-message').css('display','');
                  }
              });
            }
            else{
              $('#form-signup-message').html("The student is not one of the class students or the password is not correct.");
              $('#form-signup-message').css('display','');
            }
          });
    },
    evaluate: function(){
      // 基本上和上課範例購物車的函數很相似，這邊會用Parse DB
      //問看看Parse有沒有這個使用者之前提交過的peer review物件(
      //沒有的話: 從TAHelp生一個出來(加上scores: [‘0’, ‘0’, ‘0’, ‘0’]屬性存分數並把自己排除掉)
      //把peer review物件裡的東西透過版型印到瀏覽器上();
      //綁定表單送出的事件(); // 如果Parse沒有之前提交過的peer review物件，要自己new一個。或更新分數然後儲存。
      var currentUser = Parse.User.current();
      if(currentUser){
        //已登入
        var alc = new Parse.ACL;
        alc.setPublicReadAccess(false);
        alc.setPublicWriteAccess(false);
        alc.setReadAccess(currentUser, true);
        alc.setWriteAccess(currentUser, true);
        var eva = Parse.Object.extend("Evaluation");
        var query = new Parse.Query(eva);
        query.equalTo('user', currentUser);
        query.first({
          success: function(query){
            window.EVAL = query;
            if (query === undefined) {
                var s = TAHelp.getMemberlistOf(currentUser.get("username")).filter(function (e) {
                    return e.StudentId !== currentUser.get("username") ? true : false
                }).map(function (e) {
                    e.scores = ["0", "0", "0", "0"];
                    return e
                })
            } else {
                var s = query.toJSON().evaluations
            }
            $("#content").html(templates.evaluationView(s));
            $("#evaluationForm-submit").value = query === undefined ? "送出表單" : "修改表單";
            $("#evaluationForm").bind("submit",function () {
                for (var o = 0; o < s.length; o++) {
                    for (var u = 0; u < s[o].scores.length; u++) {
                        var a = $("#stu" + s[o].StudentId + "-q" + u);
                        var f = a.val();
                        s[o].scores[u] = f;
                    }
                }
                if (query === undefined) {
                    query = new eva;
                    query.set("user", currentUser);
                    query.setACL(alc);
                }
                query.set("evaluations", s);
                console.log(s);
                console.log(query);
                query.save(null, {
                    success: function (query) {
                        $("#content").html(templates.updateSuccessView());
                    },
                    error: function (query,error) {

                    }
                })
            })
          },
          error: function(){

          }
        });

      } else {
        //未登入
        window.location.hash = 'login/';
      } 
    }
  };
  var router = Parse.Router.extend({
    routes: {
        "": "indexView",
        "peer-evaluation/": "evaluationView",
        "login/*redirect": "loginView"
    },
    indexView: handler.evaluate,
    evaluationView: handler.evaluate,
    loginView: handler.login
  });
  this.Router = new router;
  Parse.history.start();
  handler.navbar();
  //讓router活起來();
})();
