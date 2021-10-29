module.exports = function (collection) {
    let tagSet = new Set();
    // for (const col of collection.getAll()) {
    //     console.log("------------------------");
    //     console.log(col);
    //     console.log("------------------------");
    //     console.log();
    //     console.log();
    // }
    collection.getAll().forEach(function (item) {
        if ("tags" in item.data) {
            let tags = item.data.tags;

            tags = tags.filter(function (item) {
                switch (item) {
                    // this list should match the `filter` list in tags.njk
                    case "all":
                    case "nav":
                    case "post":
                    case "posts":
                    case "projects":
                    case "no":
                        return false;
                }

                return true;
            });
            for (const tag of tags) {
                tagSet.add(tag);
            }
        }
    });

    // returning an array in addCollection works in Eleventy 0.5.3
    return [...tagSet];
};