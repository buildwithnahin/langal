import { Button } from "@/components/ui/button";
import { ArrowLeft, Beaker } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SoilTestCollection from "@/components/data-operator/SoilTestCollection";

const DataOperatorFieldData = () => {
    const navigate = useNavigate();

    return (
        <SoilTestCollection />
    );
};

export default DataOperatorFieldData;
