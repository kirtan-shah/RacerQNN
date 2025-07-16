import numpy as np

# https://rootllama.wordpress.com/2014/06/20/ray-line-segment-intersection-test-in-2d/
# ray x1(t1) = o + d*t1

# dim of ray vars:
# rayCount, numLines, 2
# dim of point vars:
# numLines, 2

def dot(a, b):
    return np.sum(a*b, axis=1)

def ray_lineseg_intersection(ray_origin, ray_direction, p1, p2):
    v1 = ray_origin - p1 # rayCount, numLines, 2
    v2 = p2 - p1 # numLines, 2
    # v3 = np.array([-ray_direction[1], ray_direction[0]])
    # rayCount, numLines, 2
    v3 = np.matmul(ray_direction, np.array([[0, 1], [-1, 0]]))
    
    # div by zero yields +/- inf, okay to ignore
    with np.errstate(divide='ignore'):
        t1 = np.cross(v2, v1) / dot(v2, v3)
        t2 = dot(v1, v3) / dot(v2, v3)
        return np.where((t1 >= 0) & (t2 >= 0) & (t2 <= 1), t1, np.inf)

# may not consider improper intersection,
# if 0 < |area| < epsilon
def linesegs_intersect(a, b, c, d):
    area1 = np.cross(a-c, b-c)
    area2 = np.cross(a-d, b-d)
    area3 = np.cross(c-a, d-a)
    area4 = np.cross(c-b, d-b)
    return np.logical_and(np.sign(area1) != np.sign(area2), np.sign(area3) != np.sign(area4))

# min dist (squared) between point p and seg vw
def min_distance_sq(ps, vs, ws):
    diff = ws - vs
    l2 = np.sum(np.square(np.abs(diff)), axis=1)
    t = np.clip(dot(ps - vs, ws - vs) / l2, 0, 1)
    proj = vs + t[:, np.newaxis] * diff
    dist2 = np.sum(np.square(ps - proj), axis=1)
    return dist2
