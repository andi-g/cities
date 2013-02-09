

function PMenu( outputtype, sizes, prices, types, defaultoption ) {
	this.outputtype = outputtype;
	this.availableprintsizes = sizes;
	this.printprices = prices;
	this.suggestedprintoption = types;
	this.defaultoption = defaultoption;
	this.chosenoption = this.defaultoption;

	this.output = function( option ){
		if( option !== undefined ){
			this.chosenoption = option;
		} else {
			this.chosenoption = this.defaultoption;
		}
		var outputli = document.getElementById("printmenuoutput");
		outputli.innerHTML = this.outputtype + " size: " + this.availableprintsizes[ this.chosenoption ] + ": $" + this.printprices[ this.chosenoption ] + " (" + this.suggestedprintoption[ this.chosenoption ] + ")";
	}
};


var printmenu = new PMenu( "Print",
	["8x12&quot;", "16x24&quot;", "24x36&quot;"],
	[ 4.99, 29.99, 44.99 ],
	["lustre", "lustre", "matte"],
	0);

var mountedmenu = new PMenu( "Mounted",
	["11x14&quot;", "16x20&quot;", "20x30&quot;"],
	[ 55.99, 86.99, 141.99 ],
	["lustre", "lustre", "lustre"],
	0);

var framedmenu = new PMenu( "Box-framed",
	["12x18&quot;", "16x20&quot;", "20x30&quot;", "24x36&quot;", "30x45&quot;"],
	[ 123.99, 160.99, 222.99, 259.99, 358.99 ],
	["Black", "Black", "Black", "Black", "Black"],
	0);

