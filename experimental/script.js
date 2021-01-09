$('#click').css("position", "fixed");

$('#click').click(function () {
    let x = $(this);
    console.log(x);
    let dest_left = $("#target").css("left");
    let dest_top = $("#target").css("top");
    x.css("z-index", "3");
    x.css("left", dest_left);
    x.css("top", dest_top);
    //x.toggleClass("totarget");
});