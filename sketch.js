let Direction = {
    TopLeft: 'top-left',
    Top: 'top',
    TopRight: 'top-right',
    Left: 'left',
    Right: 'right',
    BottomLeft: 'bottom-left',
    Bottom: 'bottom',
    BottomRight: 'bottom-right'
}

let Type = {
    Free: 0,
    Hero: 1,
    End: 9,
    Water: 3,
    Rock: 4
}

let vh = [
    Direction.Top,
    Direction.Bottom,
    Direction.Right,
    Direction.Left,
]


let diagonal = [
    Direction.TopRight,
    Direction.TopLeft,
    Direction.BottomRight,
    Direction.BottomLeft,
]

/*
 * Legendas
 *
 * 0 - Caminho livre
 * 1 - Heroi
 * 9 - Chegada
 * 3 - Água
 * 4 - Pedra
 *
 */
let grid = [
    [0, 0, 3, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 3, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 3, 0, 0, 0, 4, 4, 0, 0],
    [0, 0, 3, 0, 0, 0, 0, 0, 4, 0],
    [0, 0, 3, 0, 0, 0, 0, 0, 4, 0],
    [0, 4, 0, 0, 0, 4, 4, 0, 4, 0],
    [0, 4, 0, 4, 0, 4, 0, 0, 4, 0],
    [0, 4, 0, 4, 0, 0, 0, 4, 9, 0],
    [0, 4, 0, 4, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 4, 0, 0, 0, 0, 0, 0],
]

let id = 0
let costGVH = 10
let costGDiagonal = 14
let nodes = []
let open = []
let close = []
let path = []

let hero, end

function preload() {

    CreatePointStartEnd()
    Mount()
    AddOpenList(hero)
    FindPath(hero)
    MountPathFound(close.pop())
}

function setup() {
    createCanvas(400, 400)
    noLoop()
}

function draw() {
    background(220);

    DrawNodes()

    hero.draw()
}

/**
 * Metodos de construção visual do algoritmo
 */
function CreatePointStartEnd() {

    for(let row = 0; row < grid.length; row++) {
        for(let col = 0; col < grid[row].length; col++) {

            if(Type.Hero === grid[row][col]) {
                hero = new Node(++id, col, row, 'green')
                hero.setType(Type.Hero)
            }

            if(Type.End === grid[row][col]) {
                end = new Node(++id, col, row, 'red')
                end.setType(Type.End)
            }

            if(hero !== undefined && end !== undefined) break
        }
    }
}

function Mount() {

    for(let row = 0; row < grid.length; row++) {
        nodes[row] = []

        for(let col = 0; col < grid[row].length; col++) {

            ++id

            if(Type.Hero === grid[row][col]) {
                nodes[row].push(hero)
                continue
            }

            if(Type.End === grid[row][col]) {
                nodes[row].push(end)
                continue
            }

            let color = '#ececec'

            color = (Type.Water === grid[row][col])? 'blue' : color
            color = (Type.Rock === grid[row][col])? 'gray' : color

            let node = new Node(id, col, row, color)
            let x = Math.abs(end.position().col - col)
            let y = Math.abs(end.position().row - row)

            node.setType(grid[row][col])
            node.setH((x+y) * 10)

            nodes[row].push(node)
        }
    }
}

function DrawNodes() {

    for(let row = 0; row < nodes.length; row++) {
        for(let col = 0; col < nodes[row].length; col++) {

            nodes[row][col].draw()
        }
    }
}

function MountPathFound(node) {

    if(node === null) {
        path.reverse()
        return
    }

    path.push(node)

    MountPathFound(node.getParent())
}

function keyPressed() {
    if (keyCode === ENTER) {

        let i = 0

        let interval = setInterval(() => {
            hero.setPosition(path[i].position().row, path[i].position().col)
            redraw()
            i++

            if(i === path.length) clearInterval(interval)
        }, 300)
    }
}

/**
 * Metodos de ação para ajudar a resolver o algoritmo
 */
function FindPath(node) {

    if(ListCloseNodes().includes(end.id)) {
        return;
    }

    RemoveListOpen(node)
    AddCloseList(node)

    let children = GetNodesByNode(node)

    children = TryRecalcNodes(node, children)
    children = GetOnlyNodesValid(node, children)

    AddOpenList(children)

    let nextNode = GetNext()

    FindPath(nextNode)
}

function AddOpenList(nodes) {
    if(Array.isArray(nodes)) {
        nodes.forEach((item) => {
            open.push(item)
        })
    } else {
        open.push(nodes)
    }
}

function RemoveListOpen(node) {

    open.forEach((item, index) => {
        if(node.id === item.id) {
            open.splice(index, 1)
        }
    })
}

function AddCloseList(node) {
    close.push(node)
}

function GetNodesByNode(parent) {

    let listOpen = ListOpenNodes()
    let listClose = ListCloseNodes()

    let row = parent.position().row
    let col = parent.position().col

    let topLeft = nodes[row-1]? nodes[row-1][col-1] : null
    let top = nodes[row-1]? nodes[row-1][col] : null
    let topRight = nodes[row-1]? nodes[row-1][col+1] : null
    let left = nodes[row]? nodes[row][col-1] : null
    let right = nodes[row]? nodes[row][col+1] : null
    let bottomLeft = nodes[row+1]? nodes[row+1][col-1] : null
    let bottom = nodes[row+1]? nodes[row+1][col] : null
    let bottomRight = nodes[row+1]? nodes[row+1][col+1] : null

    let result = []

    let checkAddResult = (node, direction) => {

        if(node) {
            node.setDirection(direction)

            if(!listOpen.includes(node.id) && !listClose.includes(node.id)) {
                node.setG(parent.getG() + costGDiagonal)
                node.setParent(parent)
            }

            result.push(node)
        }
    }

    let isBlock = (node) => {
        if(node) {
            return node.getType() === Type.Water || node.getType() === Type.Rock
        }

        return false
    }

    /**
     * Trecho para bloquear as diagonais e evitar que o personagem não
     * passe por cima do obstáculo
     */
    topLeft = left !== null && !isBlock(left) && top !== null && !isBlock(top)? topLeft : null
    topRight = right !== null && !isBlock(right) && top !== null && !isBlock(top)? topRight : null
    bottomLeft = left !== null && !isBlock(left) && bottom !== null && !isBlock(bottom)? bottomLeft : null
    bottomRight = right !== null && !isBlock(right) && bottom !== null && !isBlock(bottom)? bottomRight : null

    /**
     * Checa todos os nós filhos e adiciona a lista os que forem válidos
     * e dentro do grid
     */
    checkAddResult(topLeft, Direction.TopLeft)
    checkAddResult(top, Direction.Top)
    checkAddResult(topRight, Direction.TopRight)
    checkAddResult(left, Direction.Left)
    checkAddResult(right, Direction.Right)
    checkAddResult(bottomLeft, Direction.BottomLeft)
    checkAddResult(bottom, Direction.Bottom)
    checkAddResult(bottomRight, Direction.BottomRight)

    return result
}

function TryRecalcNodes(parent, nodes) {

    let listOpen = ListOpenNodes()

    return nodes.map((n, index) => {
        if(listOpen.includes(n.id)) {
            let recalc = n.tryRecalc(parent.getG())

            if(recalc) {
                n.setParent(parent)
                ReplaceNodeInOpenList(n)
            }
        }

        return n
    })
}

function GetOnlyNodesValid(node, nodes) {

    let listOpen = ListOpenNodes()
    let listClose = ListCloseNodes()

    let result = nodes.map((n, index) => {
        if(n.getType() === Type.Water || n.getType() === Type.Rock || listClose.includes(n.id)) return

        if(listOpen.includes(n.id)) {
            let recalc = n.tryRecalc(node.getG())

            if(recalc) {
                n.setParent(node)
                ReplaceNodeInOpenList(n)
            }

            return
        }

        return n
    })

    return result.filter(function(n) {
        return n !== undefined
    })
}

function ReplaceNodeInOpenList(node) {

    for(let i = 0; i < open.length; i++) {
        if(open[i].id === node.id) {
            open[i] = node
            break
        }
    }
}

function GetNext() {

    open.sort((a, b) => {
        return a.costMove() > b.costMove()? 1 : -1
    })

    return open[0]? open[0] : []
}

function ListCloseNodes() {
    return close.map(n => n.id)
}

function ListOpenNodes() {
    return open.map(n => n.id)
}

function Node(id, col, row, color = '#ececec') {

    this.id = id
    this.col = col
    this.row = row
    this.G = 0
    this.H = 0
    this.direction = ''
    this.color = color
    this.type = Type.Free
    this.parent = null

    this.draw = (callback = null) => {
        if(callback != null) {
            callback()
        } else {
            fill(this.color)
            rect(this.col * 40, this.row * 40, 40, 40)
        }
    }

    this.setPosition = (row, col) => {
        this.row = row
        this.col = col
    }

    this.position = () => {
        return {
            row: this.row,
            col: this.col
        }
    }

    this.setG = (g) => {
        this.G = g
    }

    this.getG = () => {
        return this.G
    }

    this.setH = (h) => {
        this.H = h
    }

    this.getH = () => {
        return this.H
    }

    this.setType = (type) => {
        this.type = type
    }

    this.getType = () => {
        return this.type
    }

    this.costMove = () => {
        return this.getG() + this.getH()
    }

    this.setDirection = (direction) => {
        this.direction = direction
    }

    this.setParent = (parent) => {
        this.parent = parent
    }

    this.getParent = () => {
        return this.parent
    }

    this.tryRecalc = (parentG) => {

        if(vh.includes(this.direction) && this.getG() > (parentG + costGVH)) {
            this.setG(parentG + costGVH)
            return true
        }

        if(diagonal.includes(this.direction) && this.getG() > (parentG + costGDiagonal)) {
            this.setG(parentG + costGDiagonal)
            return true
        }

        return false
    }
}