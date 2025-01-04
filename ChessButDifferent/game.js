function initGame() {
    g('Brook1').position = "b00"
    g('Brook2').position = "b07"
    g('Bknight1').position = "b01"
    g('Bknight2').position = "b06"
    g('Bbishop1').position = "b02"
    g('Bbishop2').position = "b05"
    g('Bqueen').position = "b03"
    g('Bking').position = "b04"
    g('Bpawn1').position = "b10"
    g('Bpawn2').position = "b11"
    g('Bpawn3').position = "b12"
    g('Bpawn4').position = "b13"
    g('Bpawn5').position = "b14"
    g('Bpawn6').position = "b15"
    g('Bpawn7').position = "b16"
    g('Bpawn8').position = "b17"

    g('Wrook1').position = "b70"
    g('Wrook2').position = "b77"
    g('Wknight1').position = "b71"
    g('Wknight2').position = "b76"
    g('Wbishop1').position = "b72"
    g('Wbishop2').position = "b75"
    g('Wqueen').position = "b73"
    g('Wking').position = "b74"
    g('Wpawn1').position = "b60"
    g('Wpawn2').position = "b61"
    g('Wpawn3').position = "b62"
    g('Wpawn4').position = "b63"
    g('Wpawn5').position = "b64"
    g('Wpawn6').position = "b65"
    g('Wpawn7').position = "b66"
    g('Wpawn8').position = "b67"
}

function g(id) {
    return document.getElementById(id)
}