<script lang="ts">
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card/index.js";
  import { FolderKanban } from "@lucide/svelte";
</script>

<div>
  <h1 class="text-foreground mb-6 text-2xl font-semibold">Dashboard</h1>

  <Card>
    <CardHeader>
      <CardTitle>
        <FolderKanban class="text-muted-foreground size-5" aria-hidden="true" />
        Projects
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p class="text-muted-foreground text-sm">No projects yet.</p>
    </CardContent>
  </Card>
</div>
