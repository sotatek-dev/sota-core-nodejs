Date.prototype.yyyymmdd = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]); // padding
};

Date.prototype.yyyy_mm_dd = function(dem) {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString();
    var dd  = this.getDate().toString();
    return yyyy + dem + (mm[1]?mm:"0"+mm[0]) + dem + (dd[1]?dd:"0"+dd[0]);
};

Date.prototype.mm_dd = function(dem) {
    var mm = (this.getMonth()+1).toString();
    var dd  = this.getDate().toString();
    return (mm[1]?mm:"0"+mm[0]) + dem + (dd[1]?dd:"0"+dd[0]);
};

Date.prototype.dd_mm = function(dem) {
    var mm = (this.getMonth()+1).toString();
    var dd  = this.getDate().toString();
    return (dd[1]?dd:"0"+dd[0]) + dem + (mm[1]?mm:"0"+mm[0]);
};