import { Navigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/config/routePaths";

const IndexPage = () => <Navigate to={ROUTE_PATHS.dashboard} replace />;

export default IndexPage;
