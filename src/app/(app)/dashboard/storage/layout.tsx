import { StorageProvider } from "@/features/storage/components/storage-context"

/** Storage's shared state (the upload queue and its tray) survives moving between folders. */
export default function StorageLayout({ children }: LayoutProps<"/dashboard/storage">) {
  return <StorageProvider>{children}</StorageProvider>
}
