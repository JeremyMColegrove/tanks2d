var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var UIHandle = /** @class */ (function (_super) {
    __extends(UIHandle, _super);
    function UIHandle(x, y, w, h) {
        var _this = _super.call(this, x, y, w + 15, h + 15) || this;
        _this.startx = x; //override y movement by saving start y
        _this.starting_x = x;
        _this.visible_height = h;
        _this.visible_width = w;
        return _this;
    }
    UIHandle.prototype.update = function () {
        _super.prototype.update.call(this);
    };
    UIHandle.prototype.draw = function (context) {
        context.fillRect(this.x, this.y, this.visible_width, this.visible_height);
    };
    return UIHandle;
}(Draggable));
