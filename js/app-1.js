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
				$('#loginButton').style.display = 'none';
				$('#evaluationButton').style.display = '';
				$('#logoutButton').style.display = '';
				$('#logoutButton').addEventListener('click', function(){
			        Parse.User.logOut();
			        handlers.navbar();
			        window.location.hash = 'login/';
		      	});
			} else {
				$('#loginButton').style.display = '';
				$('#evaluationButton').style.display = 'none';
				$('#logoutButton').style.display = 'none';
			}
		},
		login: function(redirect){
			//把版型印到瀏覽器上();
			$('#content').innerHTML = templates.loginView();
	      	//綁定登入表單的學號檢查事件();  可以利用TAHelp物件
	      	$('#form-signin-student-id').addEventListener('keyup', function(){
        		var message = "The student is not one of the class students."
        		if (!TAHelp.isVaildStudentID($('#form-signin-student-id').value)){
        			$('#form-signin-message').style.display = "";
        			$('#form-signin-message').innerHTML = message;
        		}
        		else{
        			$('#form-signin-message').style.display = "none"
        			$('#form-signin-message').innerHTML = "";
        		}
	        });
	      	//綁定註冊表單的學號檢查事件();  可以利用TAHelp物件
	      	$('#form-signup-student-id').addEventListener('keyup', function(){
	        	var message = "The student is not one of the class students."
	        	if (!TAHelp.isVaildStudentID($('#form-signup-student-id').value)){
	        		$('#form-signup-message').style.display = "";
	        		$('#form-signup-message').innerHTML = message;
	        	}
	        	else{
	        		$('#form-signup-message').style.display = "none";
	        		$('#form-signup-message').innerHTML = "";
	        	}		
	        });
	      	//綁定註冊表單的密碼檢查事件();  參考上課範例
	      	$('#form-signup-password1').addEventListener('keyup', function(){
	        	var singupForm_password = $('#form-signup-password');
	        	if (this.value !== singupForm_password.value){
	        		$('#form-signup-message').innerHTML = '密碼不一致，請再確認一次。';
	        		$('#form-signup-message').style.display = "";
	        	}
	        	else{
	        		$('#form-signup-message').innerHTML = "";
	        		$('#form-signup-message').style.display = "none";
	        	}
	        });
	      	//綁定登入表單的登入檢查事件();  送出還要再檢查一次，這裡會用Parse.User.logIn
	      	$('#form-signin').addEventListener('submit', function(){
	      		if(TAHelp.isVaildStudentID($('#form-signin-student-id').value)){
		          Parse.User.logIn($('#form-signin-student-id').value,
		              $('#form-signin-password').value, {
		            success: function(user) {
		            	alert("fuck you");
		            	handlers.navbar();
        				handlers.evaluate();
        				window.location.hash = 'peer-evaluation';
		            },
		            error: function(user, error) {
		            	
		            }
		          });
	      		}
	      		else{
	      			$('#form-signup-message').innerHTML = "The student is not one of the class students or the password is not correct."
	      			$('#form-signin-message').style.display = "";
	      		}
	        });
	      	//綁定註冊表單的註冊檢查事件();  送出還要再檢查一次，這裡會用Parse.User.signUp和相關函數
      		$('#form-signup').addEventListener('submit', function(){
      			if(TAHelp.isVaildStudentID($('#form-signup-student-id').value)){
	       			var user = new Parse.User();
		        	user.set("username", $('#form-signup-student-id').value);
		        	user.set("password", $('#form-signup-password').value);
		        	user.set("email", $('#form-signup-email').value);
		 
			        user.signUp(null, {
			            success: function(user) {

			              //postAction();
			              // Hooray! Let them use the app now.
			            },
			            error: function(user, error) {
			              // Show the error message somewhere and let the user try again.
			              $('#form-signup-message').innerHTML = error.message + '['+error.code+']';
			            }
			        });
		        }
		        else{

		        	$('#form-signup-message').innerHTML = "The student is not one of the class students or the password is not correct."
		        	$('#form-signup-message').style.display = "";
		        }
	        }, false);
		},
  		evaluate: function(){
      		/* 基本上和上課範例購物車的函數很相似，這邊會用Parse DB
	      	問看看Parse有沒有這個使用者之前提交過的peer review物件(
	      	沒有的話: 從TAHelp生一個出來(加上scores: [‘0’, ‘0’, ‘0’, ‘0’]屬性存分數並把自己排除掉)
	      	把peer review物件裡的東西透過版型印到瀏覽器上();*/
     		//綁定表單送出的事件();  如果Parse沒有之前提交過的peer review物件，要自己new一個。或更新分數然後儲存。
     		var t = Parse.Object.extend("Evaluation");
            var n = Parse.User.current();
            var r = new Parse.ACL;
            r.setPublicReadAccess(false);
            r.setPublicWriteAccess(false);
            r.setReadAccess(n, true);
            r.setWriteAccess(n, true);
            var i = new Parse.Query(t);
            i.equalTo("user", n);
            i.first({
                success: function (i) {
                    window.EVAL = i;
                    if (i === undefined) {
                        var s = TAHelp.getMemberlistOf(n.get("username")).filter(function (e) {
                            return e.StudentId !== n.get("username") ? true : false
                        }).map(function (e) {
                            e.scores = ["0", "0", "0", "0"];
                            return e
                        })
                    } else {
                        var s = i.toJSON().evaluations
                    }
                    document.getElementById("content").innerHTML = e.evaluationView(s);
                    document.getElementById("evaluationForm-submit").value = i === undefined ? "送出表單" : "修改表單";
                    document.getElementById("evaluationForm").addEventListener("submit", function () {
                        for (var o = 0; o < s.length; o++) {
                            for (var u = 0; u < s[o].scores.length; u++) {
                                var a = document.getElementById("stu" + s[o].StudentId + "-q" + u);
                                var f = a.options[a.selectedIndex].value;
                                s[o].scores[u] = f
                            }
                        }
                        if (i === undefined) {
                            i = new t;
                            i.set("user", n);
                            i.setACL(r)
                        }
                        console.log(s);
                        i.set("evaluations", s);
                        i.save(null, {
                            success: function () {
                                document.getElementById("content").innerHTML = e.updateSuccessView()
                            },
                            error: function () {}
                        })
                    }, false)
                },
                error: function (e, t) {}
            })
	  }
	};

	var App = Parse.Router.extend({
	    routes: {
	      	'': 'indexView',
			'peer-evaluation': 'evaluateView',
			'login': 'loginView'
	    },
	    indexView: handler.evaluate,
	    evaluateView: handler.evaluate,
	    loginView: handler.login
  	});

	this.Router = new App();
	handler.navbar();
	//handler.login();
	//handler.evaluate();
})();
