export default function AgeCalculator() {
    return (
        <div className="w-2/5 flex items-center space-x-4">
            <span className={"grow text-center italic font-bold"}>
                JUVENILE DOB AFTER: {
                    new Date(
                        new Date().getFullYear() - 18,
                        new Date().getMonth(),
                        new Date().getDate()
                    ).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "2-digit"
                    })
                }
            </span>
        </div>
    )
}