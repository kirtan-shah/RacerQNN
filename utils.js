function intersects(a,b,c,d,p,q,r,s) {
    var det, gamma, lambda
    det = (c - a) * (s - q) - (r - p) * (d - b)
    if (det === 0) {
        return false
    } 
    else {
        lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det
        gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1)
    }
}

function intersectsWhere(a, b, c, d, p, q, r, s) {
    if(c - a == 0 && r - p == 0) return false
    if(c - a == 0 && d - b == 0) return false
    if(r - p == 0 && s - q == 0) return false
    if(c - a == 0) {
        //console.log("c - a = 0")
        let x = c
        if(!((x >= p && x <= r) || (x >= r && x <= p))) return false
        let d = (x - p) / (r - p)
        let y = q + d * (s - q)
        if(!((y >= b && y <= d) || (y >= d && y <= b))) return false
        return [x, y] 
    }
    if(r - p == 0) {
        //console.log("r - p = 0", p, q, r, s)
        let x = r
        if(!((x >= a && x <= c) || (x >= c && x <= a))) return false
        let d = (x - a) / (c - a)
        let y = b + d * (d - b)
        if(!((y >= q && y <= s) || (y >= s && y <= q))) return false
        return [x, y]
    }
    let m1 = (d - b) / (c - a)
    let m2 = (s - q) / (r - p)
    if(m1 == m2) return false
    let b1 = b - m1*a
    let b2 = q - m2*p
    let x = (b2 - b1) / (m1 - m2)
    let y = m1*x + b1
    if(a > c) {
        let tmp = a
        a = c
        c = tmp
    }
    if(p > r) {
        let tmp = p
        p = r
        r = tmp
    }
    if(x >= a && x <= c && x >= p && x <= r) 
        return [x, y]
    return false
}

// y = m1x + b1
// m1*x + b1 = m2*x + b2
// (m1 - m2)*x = b2 - b1
// x = (b2 - b1) / (m1 - m2)


function argmax(arr) {
    if(arr.length < 1) return -1
    let a = 0
    for(let i = 1; i < arr.length; i++) {
        if(arr[i] > arr[a]) a = i
    }
    return a
}

function max(arr) {
    if(arr.length < 1) return -1
    let a = 0
    for(let i = 1; i < arr.length; i++) {
        if(arr[i] > arr[a]) a = i
    }
    return arr[a]
}