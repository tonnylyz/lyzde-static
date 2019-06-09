$(function () {
    login_verify();
    feather.replace();
    window.onbeforeunload = function () {
        if (article_editor_changed) {
            return "Are you sure to leave this page with unsaved content?";
        }
        return null;
    };

    article_list_load();
});

function login_verify() {
    $.ajax({
        url: '/ajax/verify',
        method: 'get',
        success: function () {

        },
        error: function () {
            window.location.href = "/login";
        }
    });
}

function log_out() {
    $.get("/ajax/logout", function () {
        window.location.href = "/login";
    });
}

function article_list_load() {
    $.get("/ajax/article/list",
        function (list) {
            var template = '<a class="list-group-item list-group-item-action px-1" href="#" data-id="{id}" onclick="article_content_load(this); return false;">{title} <span onclick="article_delete(this)" class="badge badge-danger">&times;</span></a>';
            var al = $("#admin-article-list");
            al.empty();
            al.css("opacity", 0);
            for (var i = 0; i < list.length; i++) {
                al.append(template
                    .replace("{id}", list[i].id)
                    .replace("{title}", list[i].title));
            }
            al.css("opacity", 1);
        });
}

function article_delete(o) {
    confirm("Delete this article?", "This operation can NOT be reverted, be careful!",
        function () {
            $.get("/ajax/article/delete/" + $(o).parent().data("id"), function () {
                success("Delete succeeded", "The article has been deleted.");
                article_list_load();
                article_editor_changed = false;
                article_current_edit = null;
                article_editor_discard(function () {
                }, function () {
                });
            }).fail(function (rsp) {
                error("Delete failed", "Unable to delete this article, more info: " + rsp.responseText);
            });
        }, function () {

        });
}

var article_form = $("#article-form");
article_form.submit(function (e) {
    e.preventDefault();
    $.ajax({
        url: "/ajax/article/update",
        method: "post",
        data: article_form.serializeArray(),
        success: function () {
            article_editor_changed = false;
            article_amb();
            article_list_load();
            success("Submit Succeeded", "Check it on the public site!")
        },
        error: function (data) {
            error("Submit Failed", "Please check your inputs.");
        }
    });
});

const article_status_default = 0;
const article_status_edit = 1;
const article_status_new = 2;
var article_status = article_status_default;

var article_editor_changed = false;
article_form.find(":input").change(function () {
    article_editor_changed = true;
});

var article_current_edit;

function article_edit(o) {
    if (article_current_edit !== o) {
        article_current_edit = o;
    } else {
        return;
    }
    var amb = $("#article-main-button");
    amb.html("Discard");
    amb.removeClass("btn-info");
    amb.addClass("btn-danger");

    var id = $(o).data("id");
    $(o).parent().children().removeClass("list-group-item-info");
    $(o).addClass("list-group-item-info");
    $.get("/ajax/article/content/" + id, function (article) {
        article_form.find("input[name='id']").val(article.id);
        article_form.find("input[name='title']").val(article.title);
        article_form.find("input[name='datetime']").val(moment(article.datetime).format('YYYY-MM-DD HH:mm Z'));
        article_form.find("input[name='description']").val(article.description);
        article_form.find("input[name='viewCount']").val(article.viewCount);
        article_form.find("textarea[name='content']").val(article.content);
        article_form.find("input[name='tag']").val(article.tag);
        article_live_preview();
        article_editor_changed = false;
    });
}

function article_content_load(o) {
    if (article_current_edit === o) {
        return;
    }
    article_editor_discard(function () {
        article_status = article_status_edit;
        article_edit(o);
    }, function () {

    });
}

function article_live_preview() {
    var content = $("#article-editor").val();
    if (content.trim() !== "") {
        var converter = new showdown.Converter();
        $("#admin-article-preview").html(converter.makeHtml(content.trim()));
    } else {
        $("#admin-article-preview").html('<h1 class="text-muted text-center">Live Preview</h1>');
    }
}

function article_editor_discard(ok, cancel) {
    if (article_status === article_status_default || article_editor_changed === false) {
        ok();
        return;
    }
    confirm(
        "Discard current work?",
        "It seems that you have edited some inputs, are you sure to discard them?",
        function () {
            ok();
            article_editor_changed = false;
        }, function () {
            cancel();
        });
}

function article_amb() {
    var amb = $("#article-main-button");
    console.log(article_status);
    switch (article_status) {
        default:
        case article_status_default:
            amb.html("Discard");
            amb.removeClass("btn-info");
            amb.addClass("btn-danger");
            article_form[0].reset();
            article_form.find("input[name='id']").val(-1);
            article_form.find("input[name='datetime']").val(moment().format());
            article_live_preview();
            article_status = article_status_new;
            article_editor_changed = false;
            break;
        case article_status_edit:
            article_editor_discard(function () {
                $("#admin-article-list").children().removeClass("list-group-item-info");

                amb.html("New");
                amb.removeClass("btn-danger");
                amb.addClass("btn-info");
                article_form[0].reset();
                article_live_preview();
                article_status = article_status_default;
                article_current_edit = null;
            }, function () {

            });
            break;
        case article_status_new:
            article_editor_discard(function () {

                amb.html("New");
                amb.removeClass("btn-danger");
                amb.addClass("btn-info");
                article_form[0].reset();
                article_live_preview();
                article_status = article_status_default;

            }, function () {

            });
            break;
    }
}


function success(title, msg) {
    new PNotify({
        title: title,
        text: msg,
        type: 'success'
    });
}

function error(title, msg) {
    new PNotify({
        title: title,
        text: msg,
        type: 'error'
    });
}

function info(title, msg) {
    new PNotify({
        title: title,
        text: msg,
        type: 'info'
    });
}

function confirm(title, msg, ok, cancel) {
    (new PNotify({
        title: title,
        text: msg,
        hide: false,
        confirm: {
            confirm: true
        },
        buttons: {
            closer: false,
            sticker: false
        },
        history: {
            history: false
        },
        stack: {
            'dir1': 'down',
            'dir2': 'right',
            'modal': true
        }
    })).get().on('pnotify.confirm', function () {
        ok();
    }).on('pnotify.cancel', function () {
        cancel();
    });
}