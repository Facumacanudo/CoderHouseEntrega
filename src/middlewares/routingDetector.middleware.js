export default function RoutingDetector(req, res, next){
    console.log({
        method: req.method,
        url: req.originalUrl,
    });
    next();
}